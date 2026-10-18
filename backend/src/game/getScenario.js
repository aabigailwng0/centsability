import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CUSTOMER_EXTRAS } from '../../config/customerConfig.js';

const fallbackPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../data/fallbackScenarios.json',
);

let fallbackScenarios;

function loadFallback() {
  if (!fallbackScenarios) {
    fallbackScenarios = JSON.parse(readFileSync(fallbackPath, 'utf8'));
  }
  return fallbackScenarios;
}

/**
 * Returns { topic, facts, issueText } for one topic.
 * The body below is the hardcoded fallback. Replace this body with live
 * Nessie calls later; keep the return shape the same so routes and grading
 * do not change.
 */
export function getScenario(topic, characterName) {
  const row = loadFallback()[topic];
  if (!row) {
    const error = new Error(`Unknown topic: ${topic}`);
    error.status = 400;
    throw error;
  }

  const facts = {
    ...CUSTOMER_EXTRAS[topic],
    ...row.facts,
  };

  const issueText = row.issueText.replaceAll(row.placeholderName, characterName);
  return { topic, facts, issueText };
}
