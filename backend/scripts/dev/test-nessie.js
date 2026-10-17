import 'dotenv/config';

const key = process.env.NESSIE_API_KEY;
const base = process.env.NESSIE_BASE_URL || 'https://prod-api.nessieisreal.com';
if (!key) {
  console.log('No NESSIE_API_KEY found. Check backend/.env and run from the backend folder.');
  process.exit(1);
}

try {
  const r = await fetch(`${base}/customers?key=${key}`);
  console.log('Status:', r.status);
  const text = await r.text();
  console.log(text.slice(0, 500));
} catch (err) {
  console.log('Request failed:', err.cause?.code || err.message);
}