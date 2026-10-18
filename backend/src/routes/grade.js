import { Router } from 'express';
import { gradeConclude } from '../grading/gradeConclude.js';
import { parseDayVisits, reviewDay } from '../grading/gradeDay.js';
import { gradeListen } from '../grading/gradeListen.js';
import { scorePriority, scoreStrategies } from '../game/strategies.js';
import { rateLimit } from '../http/rateLimit.js';

const TOPICS = new Set(['budgeting', 'saving', 'debt']);
const MAX_SUMMARY = 200;
const MAX_REASON = 300;

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
  '/conclude',
  rateLimit({ windowMs: 60_000, max: 10 }),
  async (req, res) => {
    const topic = req.body?.topic;
    const reason = req.body?.reason;
    const chosenId = req.body?.chosenId;
    if (!TOPICS.has(topic)) {
      res.status(400).json({ error: 'Unknown topic.' });
      return;
    }
    if (typeof reason !== 'string') {
      res.status(400).json({ error: 'The reason must be text.' });
      return;
    }
    if (reason.length > MAX_REASON) {
      res.status(400).json({ error: 'The reason must be 300 characters or fewer.' });
      return;
    }
    try {
      const result = await gradeConclude(topic, reason.slice(0, MAX_REASON), chosenId);
      res.json({
        score: result.score,
        feedback: result.feedback,
        answer: {
          strategy: result.answer.strategy,
          explanation: result.explanation,
        },
      });
    } catch {
      res.status(500).json({ error: 'Grading failed. Please try again.' });
    }
  },
);

gradeRouter.post(
  '/day',
  rateLimit({ windowMs: 60_000, max: 6 }),
  async (req, res) => {
    try {
      const visits = parseDayVisits(req.body);
      const review = await reviewDay(visits);
      res.json(review);
    } catch (error) {
      res.status(error.status || 500).json({ error: 'The day notes could not be written.' });
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

gradeRouter.post(
  '/prioritize',
  rateLimit({ windowMs: 60_000, max: 10 }),
  (req, res) => {
    const topic = req.body?.topic;
    const strategyIds = req.body?.strategyIds;
    const chosenId = req.body?.chosenId;
    if (!TOPICS.has(topic)) {
      res.status(400).json({ error: 'Unknown topic.' });
      return;
    }
    try {
      const score = scorePriority(topic, strategyIds, chosenId);
      res.json({ score });
    } catch (error) {
      res.status(error.status || 400).json({ error: 'That choice could not be scored.' });
    }
  },
);
