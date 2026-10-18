import { STRATEGIES } from '../../config/strategies.js';
import { getScenario } from './getScenario.js';

function formatMoney(value) {
  const rounded = Math.round(Number(value) || 0);
  const absolute = Math.abs(rounded);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}$${absolute.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function viewFromFacts(facts) {
  const income = Number(facts.monthlyIncome) || 0;
  const surplus = facts.monthlySurplus ?? (income - (Number(facts.monthlySpending) || 0));
  const surplusAmount = Math.max(0, Math.round(surplus));
  return {
    topWant: facts.topWantCategory || 'extra',
    surplus: formatMoney(surplusAmount),
    surplusAmount,
  };
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const TOPICS = new Set(['budgeting', 'saving', 'debt']);

export async function dealStrategies(topic) {
  if (!TOPICS.has(topic)) {
    const error = new Error('Unknown topic');
    error.status = 400;
    throw error;
  }

  const { facts } = await getScenario(topic, 'Customer');
  const view = viewFromFacts(facts);
  const ranked = [...STRATEGIES].sort((a, b) => b.values[topic] - a.values[topic]);
  const top = ranked.slice(0, 2);
  const others = shuffle(ranked.slice(2)).slice(0, 3);
  return shuffle([...top, ...others]).map((item) => ({
    id: item.id,
    text: item.text(view),
  }));
}

export function scoreStrategies(topic, strategyIds) {
  if (!TOPICS.has(topic)) {
    const error = new Error('Unknown topic');
    error.status = 400;
    throw error;
  }
  if (!Array.isArray(strategyIds) || strategyIds.length !== 2 || new Set(strategyIds).size !== 2) {
    const error = new Error('Choose exactly two different strategies.');
    error.status = 400;
    throw error;
  }
  const chosen = strategyIds.map((id) => STRATEGIES.find((item) => item.id === id));
  if (chosen.some((item) => !item)) {
    const error = new Error('Those strategies do not belong to this topic.');
    error.status = 400;
    throw error;
  }
  const score = chosen[0].values[topic] + chosen[1].values[topic];
  return Math.min(25, Math.max(0, score));
}
