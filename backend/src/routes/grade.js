import { Router } from 'express';
import { gradeListen } from '../grading/gradeListen.js';
import { scoreStrategies } from '../game/strategies.js';
import { rateLimit } from '../http/rateLimit.js';

const TOPICS = new Set(['budgeting', 'saving', 'debt']);
const MAX_SUMMARY = 200;

export const gradeRouter = Router();

gradeRouter.post(
  '/listen',
  rateLimit({ windowMs: 60_000, max: 10 }),
  async (req, res) => {
    const topic = req.body?.topic;
    const summary = req.body?.summary;

    if (!TOPICS.has(topic)) {
      res.status(400).json({ error: 'Unknown topic.' });
      return;
    }
    if (typeof summary !== 'string') {
      res.status(400).json({ error: 'Summary must be text.' });
      return;
    }
    if (summary.length > MAX_SUMMARY) {
      res.status(400).json({ error: 'Summary must be 200 characters or fewer.' });
      return;
    }

    try {
      const result = await gradeListen(topic, summary.slice(0, MAX_SUMMARY));
      res.json({ score: result.score, feedback: result.feedback });
    } catch {
      res.status(500).json({ error: 'Grading failed. Please try again.' });
    }
  },
);

gradeRouter.post(
  '/strategize',
  rateLimit({ windowMs: 60_000, max: 10 }),
  (req, res) => {
    const topic = req.body?.topic;
    const strategyIds = req.body?.strategyIds;
    if (!TOPICS.has(topic)) {
      res.status(400).json({ error: 'Unknown topic.' });
      return;
    }
    try {
      const score = scoreStrategies(topic, strategyIds);
      res.json({ score });
    } catch (error) {
      res.status(error.status || 400).json({ error: 'Those choices could not be scored.' });
    }
  },
);
