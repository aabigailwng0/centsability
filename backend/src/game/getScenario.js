import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEBT_TERMS,
  NEEDS_CATEGORIES,
  SUBSCRIPTION_COUNTS,
  WANTS_CATEGORIES,
} from '../../config/customerConfig.js';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data');
const TOPICS = new Set(['budgeting', 'saving', 'debt']);
const CACHE_MS = 10 * 60 * 1000;
const NESSIE_TIMEOUT_MS = 5000;

const cache = new Map();

// Kept so a Nessie outage still grades against the same hardcoded story.
const FALLBACK_EXTRAS = {
  budgeting: {
    daysUntilPayday: 6,
  },
  saving: {
    emergencyFundMonths: 3,
    savingsHabit: false,
  },
  debt: {
    creditCardApr: 24.99,
    creditCardMinPayment: 70,
    interestPortionOfMinimum: 50,
    loanBalance: 8000,
    loanApr: 6.5,
    loanPayment: 180,
  },
};

function loadJson(fileName, holder) {
  if (!holder.value) {
    holder.value = JSON.parse(readFileSync(path.join(dataDir, fileName), 'utf8'));
  }
  return holder.value;
}

const fallbackHolder = { value: null };
const seededHolder = { value: null };

function loadFallback() {
  return loadJson('fallbackScenarios.json', fallbackHolder);
}

function loadSeeded() {
  return loadJson('seeded-ids.json', seededHolder);
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function formatMoney(value) {
  const rounded = roundMoney(value);
  const sign = rounded < 0 ? '-' : '';
  const absolute = Math.abs(rounded);
  const text = absolute.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(absolute) ? 0 : 2,
    maximumFractionDigits: Number.isInteger(absolute) ? 0 : 2,
  });
  return `${sign}$${text}`;
}

function asList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  if (data && typeof data === 'object' && data.amount != null) return [data];
  return [];
}

function sumCategories(spendingByCategory, names) {
  return roundMoney(names.reduce((sum, name) => sum + (spendingByCategory[name] || 0), 0));
}

function capitalCategory(category) {
  if (!category) return 'Spending';
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function fallbackScenario(topic, characterName) {
  const row = loadFallback()[topic];
  if (!row) {
    const error = new Error(`Unknown topic: ${topic}`);
    error.status = 400;
    throw error;
  }
  return {
    topic,
    facts: {
      ...FALLBACK_EXTRAS[topic],
      ...row.facts,
    },
    issueText: row.issueText.replaceAll(row.placeholderName, characterName),
  };
}

function nessieUrl(resourcePath) {
  const base = process.env.NESSIE_BASE_URL;
  const key = process.env.NESSIE_API_KEY;
  if (!base || !key) throw new Error('Nessie is not configured');
  const url = new URL(resourcePath, base.endsWith('/') ? base : `${base}/`);
  url.searchParams.set('key', key);
  return url;
}

async function nessieGet(resourcePath, signal) {
  const response = await fetch(nessieUrl(resourcePath), { signal });
  if (!response.ok) throw new Error(`Nessie status ${response.status}`);
  return response.json();
}

function issueTextFor(topic, facts, characterName) {
  const income = formatMoney(facts.monthlyIncome);
  const spending = formatMoney(facts.monthlySpending);
  if (topic === 'budgeting') {
    return [
      `I'm ${characterName}, and I bring home ${income} a month but spend about ${spending} of it.`,
      `Wants come to ${formatMoney(facts.wantsTotal)}, and ${capitalCategory(facts.topWantCategory)} alone is about ${formatMoney(facts.topWantAmount)}.`,
      `I pay for ${facts.subscriptionCount} subscriptions, and my checking account is down to ${formatMoney(facts.checking)}.`,
      'I keep running out of money before the next paycheck.',
    ].join(' ');
  }
  if (topic === 'saving') {
    return [
      `I'm ${characterName}, and I earn ${income} a month and spend about ${spending}, so about ${formatMoney(facts.monthlySurplus)} is left over.`,
      `I only have ${formatMoney(facts.savings)} in savings, which covers ${facts.monthsOfExpensesCovered} months of expenses.`,
      'I never move money into savings, so I do not have a savings habit.',
      'I also do not have an emergency fund if a surprise bill shows up.',
    ].join(' ');
  }
  return [
    `I'm ${characterName}, and I owe ${formatMoney(facts.creditCard)} on a credit card at ${facts.creditCardApr}% APR, plus a ${formatMoney(facts.loanBalance)} loan at ${facts.loanApr}% APR.`,
    `The card's minimum payment is ${formatMoney(facts.creditCardMinPayment)}, and about ${formatMoney(facts.interestPortionOfMinimum)} of that is interest, so the balance barely moves.`,
    `I also pay ${formatMoney(facts.loanPayment)} a month on the loan, and I have about ${formatMoney(facts.extraCash)} extra each month.`,
    `The ${facts.highestAprDebt.name} is my highest-APR debt, and it will not shrink if I only pay the minimum.`,
  ].join(' ');
}

async function loadLiveFacts(topic, signal) {
  const seeded = loadSeeded()[topic];
  const checkingId = seeded?.accountIds?.Checking;
  if (!checkingId) throw new Error('Seeded checking account is missing');

  const savingsId = seeded.accountIds.Savings;
  const creditCardId = seeded.accountIds['Credit Card'];
  const [checkingAccount, savingsAccount, creditAccount, deposits, purchases] = await Promise.all([
    nessieGet(`/accounts/${checkingId}`, signal),
    savingsId ? nessieGet(`/accounts/${savingsId}`, signal) : null,
    creditCardId ? nessieGet(`/accounts/${creditCardId}`, signal) : null,
    nessieGet(`/accounts/${checkingId}/deposits`, signal),
    nessieGet(`/accounts/${checkingId}/purchases`, signal),
  ]);

  let monthlyIncome = 0;
  for (const deposit of asList(deposits)) {
    monthlyIncome = roundMoney(monthlyIncome + deposit.amount);
  }

  const spendingByCategory = {};
  let monthlySpending = 0;
  for (const purchase of asList(purchases)) {
    const amount = roundMoney(purchase.amount);
    monthlySpending = roundMoney(monthlySpending + amount);
    const category = String(purchase.description || '').trim().toLowerCase();
    if (!category) continue;
    spendingByCategory[category] = roundMoney((spendingByCategory[category] || 0) + amount);
  }

  let topWantCategory = WANTS_CATEGORIES[0];
  let topWantAmount = 0;
  for (const category of WANTS_CATEGORIES) {
    const amount = spendingByCategory[category] || 0;
    if (amount > topWantAmount) {
      topWantCategory = category;
      topWantAmount = amount;
    }
  }

  const checking = roundMoney(checkingAccount?.balance);
  const savings = roundMoney(savingsAccount?.balance);
  const creditCard = roundMoney(creditAccount?.balance);
  const monthsOfExpensesCovered = monthlySpending > 0
    ? Math.round((savings / monthlySpending) * 100) / 100
    : 0;

  const facts = {
    monthlyIncome,
    monthlySpending,
    spendingByCategory,
    needsTotal: sumCategories(spendingByCategory, NEEDS_CATEGORIES),
    wantsTotal: sumCategories(spendingByCategory, WANTS_CATEGORIES),
    topWantCategory,
    topWantAmount,
    needsLimit: roundMoney(monthlyIncome * 0.5),
    wantsLimit: roundMoney(monthlyIncome * 0.3),
    savingsLimit: roundMoney(monthlyIncome * 0.2),
    checking,
    savings,
    creditCard,
    monthsOfExpensesCovered,
    monthlySurplus: roundMoney(monthlyIncome - monthlySpending),
    highestAprDebt: null,
    interestPortionOfMinimum: 0,
  };

  if (SUBSCRIPTION_COUNTS[topic] != null) {
    facts.subscriptionCount = SUBSCRIPTION_COUNTS[topic];
  }

  if (topic === 'debt') {
    const cardApr = DEBT_TERMS.creditCardApr;
    const loanApr = DEBT_TERMS.loanApr;
    facts.creditCardApr = cardApr;
    facts.creditCardMinPayment = DEBT_TERMS.creditCardMinPayment;
    facts.interestPortionOfMinimum = DEBT_TERMS.interestPortionOfMinimum;
    facts.loanBalance = DEBT_TERMS.loanBalance;
    facts.loanApr = loanApr;
    facts.loanPayment = DEBT_TERMS.loanPayment;
    facts.extraCash = DEBT_TERMS.extraCash;
    facts.highestAprDebt = cardApr >= loanApr
      ? { name: 'credit card', apr: cardApr, balance: creditCard }
      : { name: 'loan', apr: loanApr, balance: DEBT_TERMS.loanBalance };
  }

  return facts;
}

/**
 * Returns { topic, facts, issueText }.
 * Facts are computed from Nessie. A failure or a call slower than 5 seconds
 * uses the hardcoded scenario instead.
 */
export async function getScenario(topic, characterName) {
  if (!TOPICS.has(topic)) {
    const error = new Error(`Unknown topic: ${topic}`);
    error.status = 400;
    throw error;
  }

  const cached = cache.get(topic);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return {
      topic,
      facts: cached.facts,
      issueText: issueTextFor(topic, cached.facts, characterName),
    };
  }

  try {
    const facts = await loadLiveFacts(topic, AbortSignal.timeout(NESSIE_TIMEOUT_MS));
    cache.set(topic, { at: Date.now(), facts });
    return { topic, facts, issueText: issueTextFor(topic, facts, characterName) };
  } catch {
    console.warn(`Nessie scenario for ${topic} failed or timed out; using the hardcoded scenario.`);
    return fallbackScenario(topic, characterName);
  }
}
