import 'dotenv/config';

const key = process.env.NESSIE_API_KEY;
const base = process.env.NESSIE_BASE_URL || 'https://prod-api.nessieisreal.com';

async function probe(path) {
  try {
    const r = await fetch(`${base}${path}?key=${key}`, { signal: AbortSignal.timeout(20000) });
    const text = await r.text();
    console.log(`  ${path} -> ${r.status}  ${text.slice(0, 160).replace(/\s+/g, ' ')}`);
    return r.ok ? text : null;
  } catch (err) {
    console.log(`  ${path} -> failed: ${err.cause?.code || err.name}`);
    return null;
  }
}

const accountsText = await probe('/enterprise/accounts');
const accounts = JSON.parse(accountsText || '[]');

// One sample account of each type that has a non-zero balance
const samples = {};
for (const a of accounts) {
  if (Number(a.balance) > 0 && !samples[a.type]) samples[a.type] = a;
}
console.log('\nSample accounts found:', Object.keys(samples).join(', ') || 'none with a balance above 0');

for (const [type, a] of Object.entries(samples)) {
  console.log(`\n--- ${type} account (balance ${a.balance}) ---`);
  const id = a._id;
  await probe(`/enterprise/accounts/${id}`);
  await probe(`/enterprise/accounts/${id}/purchases`);
  await probe(`/enterprise/accounts/${id}/deposits`);
  await probe(`/enterprise/accounts/${id}/withdrawals`);
  await probe(`/enterprise/accounts/${id}/loans`);
  await probe(`/enterprise/accounts/${id}/bills`);
  await probe(`/accounts/${id}/purchases`);
  await probe(`/accounts/${id}/deposits`);
}

console.log('\n--- retry the list that timed out ---');
await probe('/enterprise/deposits');