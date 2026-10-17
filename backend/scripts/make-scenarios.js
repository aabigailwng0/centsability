import 'dotenv/config';
import fs from 'node:fs';

const nessieKey = process.env.NESSIE_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY;
const base = process.env.NESSIE_BASE_URL || 'https://prod-api.nessieisreal.com';
const HOW_MANY = 3;

const snapshot = JSON.parse(fs.readFileSync('data/nessie-snapshot.json', 'utf8'));
const sum = (arr, f) => arr.reduce((t, i) => t + (Number(f(i)) || 0), 0);

// Merchant names (best effort)
let merchants = {};
try {
  const r = await fetch(`${base}/enterprise/merchants?key=${nessieKey}`, { signal: AbortSignal.timeout(30000) });
  for (const m of await r.json()) merchants[m._id] = m.name || m.category || 'Unknown merchant';
} catch { console.log('Could not load merchant names; continuing without them.'); }

// Keep customers with real activity, then shuffle
const usable = snapshot.filter((c) => c.deposits.length >= 1 && c.purchases.length >= 8);
usable.sort(() => Math.random() - 0.5);
console.log(`${usable.length} usable customers. Building ${HOW_MANY}...`);

function facts(c) {
  const dates = [...c.purchases, ...c.deposits]
    .map((r) => new Date(r.purchase_date || r.transaction_date)).filter((d) => !isNaN(d));
  const months = dates.length > 1 ? Math.max(1, (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24 * 30)) : 1;
  const income = sum(c.deposits, (d) => d.amount) / months;
  const spend = sum(c.purchases, (p) => p.amount) / months;
  const byMerchant = {};
  for (const p of c.purchases) {
    const n = merchants[p.merchant_id] || 'Other';
    byMerchant[n] = (byMerchant[n] || 0) + (Number(p.amount) || 0) / months;
  }
  const top = Object.entries(byMerchant).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([name, amt]) => ({ name, monthly: Math.round(amt) }));
  const bal = (t) => Math.round(sum(c.accounts.filter((a) => a.type === t), (a) => a.balance));
  return {
    monthlyIncome: Math.round(income), monthlySpending: Math.round(spend),
    checking: bal('Checking'), savings: bal('Savings'), creditCard: bal('Credit Card'),
    topMerchants: top,
  };
}

function topicOf(f) {
  if (f.creditCard > 0) return 'debt';
  if (f.monthlyIncome > 0 && f.monthlySpending >= f.monthlyIncome * 0.85) return 'budgeting';
  return 'saving';
}

async function gemini(prompt) {
  if (!geminiKey) throw new Error('GEMINI_API_KEY is missing from backend/.env');
  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await r.json();
  if (!r.ok) {
    console.log(`Gemini HTTP ${r.status}:`, JSON.stringify(data.error || data).slice(0, 400));
    process.exit(1); // stop at the first failure instead of repeating it 119 times
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response: ' + JSON.stringify(data).slice(0, 300));
  return JSON.parse(text);
}

function numbersOk(text, f) {
  const allowed = [f.monthlyIncome, f.monthlySpending, f.checking, f.savings, f.creditCard,
    ...f.topMerchants.map((m) => m.monthly)];
  const found = (text.match(/\$\s?([\d,]+)/g) || []).map((s) => Number(s.replace(/[^\d]/g, '')));
  return found.every((n) => allowed.some((a) => Math.abs(a - n) <= 1));
}

const out = [];
for (const c of usable) {
  if (out.length >= HOW_MANY) break;
  const f = facts(c);
  const topic = topicOf(f);
  const prompt = `You write customers for a financial literacy game. Topic: ${topic}.
Facts (the ONLY numbers you may use, exactly as given): ${JSON.stringify(f)}
Invent a fictional first name and a one-line personality. Write a 2-3 sentence speech bubble in the customer's voice describing their money situation for this topic. Use dollar amounts only from the facts. Do not give advice. Return JSON: {"name":"","personality":"","speechBubble":""}`;
  try {
    const g = await gemini(prompt);
    if (!g.speechBubble || !numbersOk(g.speechBubble, f)) { console.log('Rejected: numbers did not match facts.'); continue; }
    out.push({ sourceCustomerId: c.id, topic, facts: f, ...g });
    console.log(`OK: ${g.name} (${topic})`);
  } catch (e) { console.log('Gemini call failed:', e.message); }
}

fs.writeFileSync('data/scenarios.json', JSON.stringify(out, null, 2));
console.log(`Saved ${out.length} scenario(s) to backend/data/scenarios.json`);