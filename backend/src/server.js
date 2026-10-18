import express from 'express';
import { gameRouter } from './routes/game.js';
import { gradeRouter } from './routes/grade.js';
import { devRouter } from './routes/dev.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '8kb' }));
app.use('/api/game', gameRouter);
app.use('/api/grade', gradeRouter);
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev', devRouter);
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'centsability-backend', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Centsability backend listening on http://localhost:${PORT}`);
});
