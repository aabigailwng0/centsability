import 'dotenv/config';
import fs from 'node:fs';

const key = process.env.NESSIE_API_KEY;
const base = process.env.NESSIE_BASE_URL || 'https://prod-api.nessieisreal.com';
const SAMPLE = 120; // customers to scan
const CONCURRENCY = 4;

async function get(path) {
  try {
    const r = await fetch(`${base}${path}?key=${key}`, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

const list = (x) => (Array.isArray(x) ? x : []);
const sum = (arr, f) => arr.reduce((t, i) => t + (Number(f(i)) || 0), 0);
const money = (n) => `$${Math.round(n).toLocaleString()}`;
const dateOf = (r) => r.purchase_date || r.transaction_date || r.creation_date || null;

const customers = list(await get('/enterprise/customers'));
const accounts = list(await get('/enterprise/accounts'));
console.log(`Loaded ${customers.length} customers, ${accounts.length} accounts.`);

// Group accounts by customer; keep customers with 2+ accounts and some money
const byCustomer = {};
for (const a of accounts) (byCustomer[a.customer_id] ||= []).push(a);
const candidates = customers
  .filter((c) => {
    const accs = byCustomer[c._id] || [];
    return accs.length >= 2 && accs.some((a) => Number(a.balance) > 0);
  })
  .slice(0, SAMPLE);
console.log(`Scanning ${candidates.length} candidate customers...\n`);

async function scan(c) {
  const accs = byCustomer[c._id];
  const out = { id: c._id, name: `${c.first_name} ${c.last_name}`, accounts: [], deposits: [], purchases: [], bills: [], loans: [] };
  for (const a of accs) {
    out.accounts.push({ id: a._id, type: a.type, nickname: a.nickname, balance: a.balance });
    const [pur, dep, bills, loans] = await Promise.all([
      get(`/accounts/${a._id}/purchases`),
      get(`/accounts/${a._id}/deposits`),
      get(`/accounts/${a._id}/bills`),
      get(`/accounts/${a._id}/loans`),
    ]);
    out.purchases.push(...list(pur));
    out.deposits.push(...list(dep));
    out.bills.push(...list(bills));
    out.loans.push(...list(loans));
  }
  return out;
}

const results = [];
let next = 0;
async function worker() {
  while (next < candidates.length) {
    const c = candidates[next++];
    results.push(await scan(c));
    process.stdout.write('.');
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log('\n');

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/nessie-snapshot.json', JSON.stringify(results, null, 2));

const fits = { BUDGETING: [], SAVING: [], DEBT: [] };
for (const r of results) {
  const income = sum(r.deposits, (d) => d.amount);
  const spend = sum(r.purchases, (p) => p.amount);
  const dates = [...r.purchases, ...r.deposits].map(dateOf).filter(Boolean).map((d) => new Date(d)).filter((d) => !isNaN(d));
  const months = dates.length > 1 ? Math.max(1, (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24 * 30)) : 1;
  const savings = sum(r.accounts.filter((a) => a.type === 'Savings'), (a) => a.balance);
  const card = sum(r.accounts.filter((a) => a.type === 'Credit Card'), (a) => a.balance);
  const monthlySpend = spend / months;

  const topics = [];
  if (income > 0 && r.purchases.length >= 8 && spend >= income * 0.85) topics.push('BUDGETING');
  if (income > 0 && monthlySpend > 0 && savings > 0 && savings < monthlySpend * 2) topics.push('SAVING');
  if (card > 0 || r.loans.length > 0) topics.push('DEBT');
  topics.forEach((t) => fits[t].push(r.id));

  if (topics.length) {
    console.log(`${r.name} [${r.id.slice(0, 8)}]  fits: ${topics.join(', ')}`);
    console.log(`  ${r.accounts.map((a) => `${a.type} ${money(a.balance)} "${a.nickname}"`).join(' | ')}`);
    console.log(`  deposits ${r.deposits.length} (${money(income)})  purchases ${r.purchases.length} (${money(spend)})  bills ${r.bills.length}  loans ${r.loans.length}  ~${months.toFixed(1)} months`);
  }
}
console.log(`\nFit counts: BUDGETING ${fits.BUDGETING.length}, SAVING ${fits.SAVING.length}, DEBT ${fits.DEBT.length}`);
console.log('Full data saved to backend/data/nessie-snapshot.json');