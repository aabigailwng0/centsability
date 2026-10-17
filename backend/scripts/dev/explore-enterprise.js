import 'dotenv/config';

const key = process.env.NESSIE_API_KEY;
const base = process.env.NESSIE_BASE_URL || 'https://prod-api.nessieisreal.com';

async function get(path) {
  try {
    const r = await fetch(`${base}${path}?key=${key}`);
    if (!r.ok) return { error: `HTTP ${r.status} on ${path}` };
    return await r.json();
  } catch (err) {
    return { error: `${err.cause?.code || err.message} on ${path}` };
  }
}

const list = (x) => (Array.isArray(x) ? x : []);
const sum = (arr, f) => arr.reduce((t, i) => t + (Number(f(i)) || 0), 0);
const money = (n) => `$${Math.round(n).toLocaleString()}`;

const paths = ['customers', 'accounts', 'deposits', 'purchases', 'bills', 'loans', 'withdrawals', 'merchants'];
const data = {};
for (const p of paths) {
  const res = await get(`/enterprise/${p}`);
  if (res.error) {
    console.log(`${p}: ${res.error}`);
    data[p] = [];
  } else {
    data[p] = list(res);
    console.log(`${p}: ${data[p].length} records`);
  }
}

// Fields seen
console.log('\n=== FIELDS ===');
for (const p of ['accounts', 'deposits', 'purchases', 'bills', 'loans']) {
  const keys = new Set();
  data[p].slice(0, 50).forEach((r) => Object.keys(r).forEach((k) => keys.add(k)));
  console.log(`${p}: ${[...keys].join(', ') || '(none)'}`);
}

// Group everything by customer through the account's customer_id
const accountOwner = {};
data.accounts.forEach((a) => { accountOwner[a._id] = a.customer_id; });

const byCustomer = {};
for (const c of data.customers) {
  byCustomer[c._id] = { name: `${c.first_name} ${c.last_name}`, types: {}, bal: {}, dep: [], pur: [], loans: [] };
}
for (const a of data.accounts) {
  const c = byCustomer[a.customer_id];
  if (!c) continue;
  c.types[a.type] = (c.types[a.type] || 0) + 1;
  c.bal[a.type] = (c.bal[a.type] || 0) + (Number(a.balance) || 0);
}
const attach = (items, field, target) => {
  for (const i of items) {
    const cid = accountOwner[i[field]];
    if (cid && byCustomer[cid]) byCustomer[cid][target].push(i);
  }
};
attach(data.deposits, 'payee_id', 'dep');   // deposits may use account_id; try both
attach(data.deposits, 'account_id', 'dep');
attach(data.purchases, 'payer_id', 'pur');
attach(data.purchases, 'account_id', 'pur');
attach(data.loans, 'account_id', 'loans');

console.log('\n=== CUSTOMERS WITH ANY ACTIVITY (deposits, purchases, or loans) ===');
let shown = 0;
for (const [id, c] of Object.entries(byCustomer)) {
  if (c.dep.length + c.pur.length + c.loans.length === 0) continue;
  shown++;
  console.log(`\n${c.name} [${id}]`);
  console.log(`  accounts: ${JSON.stringify(c.types)}  balances: ${JSON.stringify(c.bal)}`);
  console.log(`  deposits: ${c.dep.length} (${money(sum(c.dep, (d) => d.amount))})  purchases: ${c.pur.length} (${money(sum(c.pur, (p) => p.amount))})  loans: ${c.loans.length}`);
}
console.log(`\n${shown} of ${data.customers.length} customers have any activity.`);