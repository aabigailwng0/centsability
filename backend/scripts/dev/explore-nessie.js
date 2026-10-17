import 'dotenv/config';

const key = process.env.NESSIE_API_KEY;
const base = process.env.NESSIE_BASE_URL || 'https://prod-api.nessieisreal.com';
const MAX_CUSTOMERS = 25;

if (!key) {
  console.log('No NESSIE_API_KEY found. Check backend/.env.');
  process.exit(1);
}

// GET helper. Never prints the key or the full URL.
async function get(path) {
  try {
    const r = await fetch(`${base}${path}?key=${key}`);
    if (!r.ok) return { error: `HTTP ${r.status} on ${path}` };
    return await r.json();
  } catch (err) {
    return { error: `${err.cause?.code || err.message} on ${path}` };
  }
}

const asList = (x) => (Array.isArray(x) ? x : []);
const sum = (arr, f) => arr.reduce((t, i) => t + (Number(f(i)) || 0), 0);
const money = (n) => `$${Math.round(n).toLocaleString()}`;

const customers = asList(await get('/customers')).slice(0, MAX_CUSTOMERS);
console.log(`Found ${customers.length} customer(s) (showing up to ${MAX_CUSTOMERS}).\n`);

const seenFields = { purchase: new Set(), deposit: new Set(), loan: new Set(), account: new Set() };
const errors = [];
const results = [];

for (const c of customers) {
  const accounts = asList(await get(`/customers/${c._id}/accounts`));
  const row = {
    id: c._id,
    name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
    byType: {},
    balances: {},
    purchases: [],
    deposits: [],
    bills: [],
    loans: [],
  };

  for (const a of accounts) {
    Object.keys(a).forEach((k) => seenFields.account.add(k));
    row.byType[a.type] = (row.byType[a.type] || 0) + 1;
    row.balances[a.type] = (row.balances[a.type] || 0) + (Number(a.balance) || 0);

    for (const [kind, path] of [
      ['purchases', 'purchases'],
      ['deposits', 'deposits'],
      ['bills', 'bills'],
      ['loans', 'loans'],
    ]) {
      const data = await get(`/accounts/${a._id}/${path}`);
      if (data.error) { errors.push(data.error); continue; }
      const list = asList(data);
      row[kind].push(...list);
      const fieldKey = kind === 'purchases' ? 'purchase' : kind === 'deposits' ? 'deposit' : kind === 'loans' ? 'loan' : null;
      if (fieldKey) list.forEach((i) => Object.keys(i).forEach((k) => seenFields[fieldKey].add(k)));
    }
  }
  results.push(row);
}

// Months of data, estimated from purchase dates (at least 1)
function monthsSpan(purchases) {
  const dates = purchases.map((p) => new Date(p.purchase_date)).filter((d) => !isNaN(d));
  if (dates.length < 2) return 1;
  const span = (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24 * 30);
  return Math.max(1, span);
}

console.log('=== PER CUSTOMER ===');
for (const r of results) {
  const income = sum(r.deposits, (d) => d.amount);
  const spend = sum(r.purchases, (p) => p.amount);
  const months = monthsSpan(r.purchases);
  const monthlySpend = spend / months;
  const savings = r.balances['Savings'] || 0;
  const card = r.balances['Credit Card'] || 0;
  const loanTotal = sum(r.loans, (l) => l.amount);

  const flags = [];
  if (income > 0 && spend >= income * 0.9) flags.push('BUDGETING');
  if (monthlySpend > 0 && savings < monthlySpend) flags.push('SAVING');
  if (card > 0 || loanTotal > 0) flags.push('DEBT');

  console.log(`\n${r.name || '(no name)'}  [${r.id}]`);
  console.log(`  accounts: ${JSON.stringify(r.byType)}`);
  console.log(`  balances: ${Object.entries(r.balances).map(([t, b]) => `${t} ${money(b)}`).join(', ') || 'none'}`);
  console.log(`  purchases: ${r.purchases.length} (${money(spend)})  deposits: ${r.deposits.length} (${money(income)})  bills: ${r.bills.length}  loans: ${r.loans.length} (${money(loanTotal)})`);
  console.log(`  est. months of data: ${months.toFixed(1)}  est. monthly spend: ${money(monthlySpend)}`);
  console.log(`  fits: ${flags.join(', ') || 'none'}`);
}

console.log('\n=== FIELDS FOUND ===');
for (const [k, set] of Object.entries(seenFields)) {
  console.log(`${k}: ${[...set].join(', ') || '(none seen)'}`);
}

if (errors.length) {
  console.log(`\n=== ${errors.length} request error(s), first 5 ===`);
  errors.slice(0, 5).forEach((e) => console.log(' ', e));
}