import 'dotenv/config';

const key = process.env.NESSIE_API_KEY;
const base = process.env.NESSIE_BASE_URL || 'https://prod-api.nessieisreal.com';

if (!key) {
  console.log('Missing NESSIE_API_KEY in backend/.env');
  process.exit(1);
}

async function post(path, body) {
  const r = await fetch(`${base}${path}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  console.log(`${path} -> status ${r.status}`);
  console.log(text.slice(0, 400));
  try { return JSON.parse(text); } catch { return null; }
}

const customer = await post('/customers', {
  first_name: 'Test',
  last_name: 'Customer',
  address: {
    street_number: '100',
    street_name: 'Main St',
    city: 'Richmond',
    state: 'VA',
    zip: '23219',
  },
});

const customerId = customer?.objectCreated?._id || customer?._id;
if (customerId) {
  await post(`/customers/${customerId}/accounts`, {
    type: 'Checking',
    nickname: 'Test Checking',
    rewards: 0,
    balance: 100,
  });
} else {
  console.log('No customer id came back, so the account step was skipped.');
}