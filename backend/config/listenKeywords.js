// Used only on the server. Never send this file's contents to the browser.
// Groups match the numbers in backend/data/fallbackScenarios.json.
export const LISTEN_KEYWORDS = {
  budgeting: {
    problem: [
      'spend',
      'spending',
      'income',
      'budget',
      'payday',
      'paycheck',
      'run out',
      'running out',
      'takeout',
      'subscription',
    ],
    facts: ['2800', '2,800', '2750', '2,750', '420', '48', '90', 'noodle', 'streamstack'],
  },
  saving: {
    problem: ['saving', 'savings', 'emergency', 'habit', 'fund'],
    facts: ['3400', '3,400', '2100', '2,100', '220'],
  },
  debt: {
    problem: ['credit', 'card', 'interest', 'apr', 'minimum', 'balance', 'loan', 'debt'],
    facts: ['2400', '2,400', '24.99', '8000', '8,000', '6.5', '70', '50', '180', '3600', '3,600'],
  },
};
