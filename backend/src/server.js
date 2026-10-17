import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'centsability-backend', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Centsability backend listening on http://localhost:${PORT}`);
});
