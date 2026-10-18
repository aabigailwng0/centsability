import 'dotenv/config';
import fs from 'node:fs';

const key = process.env.NESSIE_API_KEY;
const base = process.env.NESSIE_BASE_URL || 'https://prod-api.nessieisreal.com';
const ids = JSON.parse(fs.readFileSync('data/seeded-ids.json', 'utf8'));

const get = async (p) => (await fetch(`${base}${p}?key=${key}`)).json();
const sum = (a) => a.reduce((t, x) => t + (Number(x.amount) || 0), 0);

for (const [topic, c] of Object.entries(ids)) {
  const checking = c.accountIds['Checking'];
  const dep = await get(`/accounts/${checking}/deposits`);
  const pur = await get(`/accounts/${checking}/purchases`);
  console.log(`${topic}: ${dep.length} deposit(s) = $${sum(dep)}, ${pur.length} purchase(s) = $${Math.round(sum(pur))}`);
}