import { Router } from 'express';
import { getScenario } from '../game/getScenario.js';

const TOPICS = new Set(['budgeting', 'saving', 'debt']);

export const devRouter = Router();

devRouter.get('/scenario/:topic', async (req, res) => {
  const { topic } = req.params;
  if (!TOPICS.has(topic)) {
    res.status(400).json({ error: 'Unknown topic.' });
    return;
  }

  try {
    const scenario = await getScenario(topic, 'Customer');
    res.json({ topic: scenario.topic, facts: scenario.facts });
  } catch {
    res.status(500).json({ error: 'Could not load that scenario.' });
  }
});
