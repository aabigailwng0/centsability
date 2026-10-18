import 'dotenv/config';

const key = process.env.NESSIE_API_KEY;
const base = process.env.NESSIE_BASE_URL || 'https://prod-api.nessieisreal.com';
const ACCOUNT_ID = '211f2366-3260-4134-ae00-2bfac3d96985'; // the Test Checking account from your output

async function call(method, path, body) {
  const r = await fetch(`${base}${path}?key=${key}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  console.log(`${method} ${path} -> ${r.status}`);
  console.log(text.slice(0, 300));
  try { return JSON.parse(text); } catch { return null; }
}

const today = new Date().toISOString().slice(0, 10);

const merchants = await call('GET', '/enterprise/merchants');
const merchantId = Array.isArray(merchants) ? merchants[0]?._id : null;

await call('POST', `/accounts/${ACCOUNT_ID}/deposits`, {
  medium: 'balance',
  transaction_date: today,
  status: 'completed',
  amount: 2400,
  description: 'paycheck',
});

if (merchantId) {
  await call('POST', `/accounts/${ACCOUNT_ID}/purchases`, {
    merchant_id: merchantId,
    medium: 'balance',
    purchase_date: today,
    amount: 35,
    status: 'completed',
    description: 'takeout',
  });
}

console.log('\n--- reading back ---');
await call('GET', `/accounts/${ACCOUNT_ID}/deposits`);
await call('GET', `/accounts/${ACCOUNT_ID}/purchases`);