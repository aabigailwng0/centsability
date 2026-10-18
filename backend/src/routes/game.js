import { Router } from 'express';
import { ANIMALS, CHARACTERS } from '../../config/characters.js';
import { getScenario } from '../game/getScenario.js';

const TOPICS = ['budgeting', 'saving', 'debt'];

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const gameRouter = Router();

// Two different topics, random order, each with a different animal.
// Facts stay on the server. The browser only receives the story text.
gameRouter.get('/start', (_req, res) => {
  const topics = shuffle(TOPICS).slice(0, 2);
  const animals = shuffle(ANIMALS);

  const customers = topics.map((topic, index) => {
    const animal = animals[index];
    const name = CHARACTERS[animal];
    const scenario = getScenario(topic, name);
    return {
      topic: scenario.topic,
      animal,
      name,
      issueText: scenario.issueText,
    };
  });

  res.json({ customers });
});
