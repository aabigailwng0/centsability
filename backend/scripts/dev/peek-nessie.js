import 'dotenv/config';

const key = process.env.NESSIE_API_KEY;
const base = process.env.NESSIE_BASE_URL || 'https://prod-api.nessieisreal.com';

for (const path of ['/customers', '/enterprise/customers', '/enterprise/accounts']) {
  try {
    const r = await fetch(`${base}${path}?key=${key}`);
    const text = await r.text();
    console.log(`\n${path} -> status ${r.status}`);
    console.log(text.slice(0, 400));
  } catch (err) {
    console.log(`\n${path} -> failed: ${err.cause?.code || err.message}`);
  }
}