import 'dotenv/config';
import fs from 'node:fs';

const key = process.env.NESSIE_API_KEY;
const base = process.env.NESSIE_BASE_URL || 'https://prod-api.nessieisreal.com';
const IDS_FILE = 'data/seeded-ids.json';

if (!key) { console.log('Missing NESSIE_API_KEY in backend/.env'); process.exit(1); }
if (fs.existsSync(IDS_FILE) && !process.argv.includes('--force')) {
  console.log(`${IDS_FILE} already exists, so customers were already seeded. Use --force to seed again.`);
  process.exit(0);
}

async function call(method, path, body) {
  const r = await fetch(`${base}${path}?key=${key}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  const text = await r.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  if (!r.ok) {
    console.log(`FAILED ${method} ${path} -> ${r.status} ${text.slice(0, 300)}`);
    process.exit(1);
  }
  return data;
}
const idOf = (res) => res?.objectCreated?._id || res?._id;

const dayStr = (daysAgo) => {
  const d = new Date(Date.now() - daysAgo * 86400000);
  return d.toISOString().slice(0, 10);
};

// Use existing merchants (a purchase needs a merchant_id). The spending
// category goes in the description, which is what the game reads.
const merchantList = await call('GET', '/enterprise/merchants');
const merchantIds = merchantList.slice(0, 12).map((m) => m._id);
if (merchantIds.length === 0) { console.log('No merchants found.'); process.exit(1); }

const CUSTOMERS = [
  {
    topic: 'budgeting', first: 'Maya', last: 'Budget',
    income: 2400,
    accounts: [{ type: 'Checking', nickname: 'Maya Checking', balance: 38 }],
    spend: { rent: 1000, groceries: 310, utilities: 160, takeout: 420, subscriptions: 85, rideshare: 140, shopping: 315 },
    counts: { rent: 1, groceries: 6, utilities: 2, takeout: 12, subscriptions: 6, rideshare: 7, shopping: 5 },
  },
  {
    topic: 'saving', first: 'Jordan', last: 'Saver',
    income: 3000,
    accounts: [
      { type: 'Checking', nickname: 'Jordan Checking', balance: 1150 },
      { type: 'Savings', nickname: 'Jordan Savings', balance: 240 },
    ],
    spend: { rent: 1150, groceries: 420, utilities: 190, transport: 240, dining: 300, shopping: 220, subscriptions: 90, entertainment: 240 },
    counts: { rent: 1, groceries: 6, utilities: 2, transport: 5, dining: 8, shopping: 4, subscriptions: 3, entertainment: 4 },
  },
  {
    topic: 'debt', first: 'Sam', last: 'Debtor',
    income: 3300,
    accounts: [
      { type: 'Checking', nickname: 'Sam Checking', balance: 1100 },
      { type: 'Credit Card', nickname: 'Sam Credit Card', balance: 4200 },
    ],
    spend: { rent: 1200, groceries: 420, utilities: 200, transport: 300, dining: 250, shopping: 200, entertainment: 195 },
    counts: { rent: 1, groceries: 6, utilities: 2, transport: 5, dining: 6, shopping: 3, entertainment: 3 },
  },
];

const out = {};
for (const c of CUSTOMERS) {
  console.log(`\nCreating ${c.first} (${c.topic})...`);
  const cust = await call('POST', '/customers', {
    first_name: c.first,
    last_name: c.last,
    address: { street_number: '100', street_name: 'Main St', city: 'Richmond', state: 'VA', zip: '23219' },
  });
  const customerId = idOf(cust);
  if (!customerId) { console.log('No customer id in response:', JSON.stringify(cust).slice(0, 200)); process.exit(1); }

  const accountIds = {};
  for (const a of c.accounts) {
    const acc = await call('POST', `/customers/${customerId}/accounts`, {
      type: a.type, nickname: a.nickname, rewards: 0, balance: a.balance,
    });
    accountIds[a.type] = idOf(acc);
  }
  const checkingId = accountIds['Checking'];

  await call('POST', `/accounts/${checkingId}/deposits`, {
    medium: 'balance', transaction_date: dayStr(28), status: 'completed',
    amount: c.income, description: 'paycheck',
  });

  let n = 0;
  for (const [category, total] of Object.entries(c.spend)) {
    const count = c.counts[category] || 1;
    const each = Math.round((total / count) * 100) / 100;
    for (let i = 0; i < count; i++) {
      await call('POST', `/accounts/${checkingId}/purchases`, {
        merchant_id: merchantIds[(n++) % merchantIds.length],
        medium: 'balance',
        purchase_date: dayStr(1 + ((i * 7 + n) % 27)),
        amount: each,
        status: 'completed',
        description: category,
      });
    }
  }
  out[c.topic] = { customerId, accountIds, name: `${c.first} ${c.last}` };
  console.log(`  done: ${customerId}`);
}

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync(IDS_FILE, JSON.stringify(out, null, 2));
console.log(`\nSaved IDs to ${IDS_FILE}`);