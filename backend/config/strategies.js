// One shared list for every topic. Each visit shows the two strongest for that
// topic, plus three of the other five.
// values[topic] stays on the server: best 13, strong 12, okay 5, weak 2, harmful 0.
// The best pair is the two moves that match that customer's problem.

export const STRATEGIES = [
  {
    id: 'split-income',
    text: () => 'Split pay: 50% needs, 30% wants, 20% savings.',
    values: { budgeting: 13, saving: 5, debt: 5 },
  },
  {
    id: 'cut-top-want',
    text: (v) => `Cut ${v.topWant} spending about in half.`,
    values: { budgeting: 12, saving: 5, debt: 2 },
  },
  {
    id: 'auto-save',
    text: (v) => (
      v.surplusAmount > 0
        ? `Automatically save ${v.surplus} on each payday.`
        : 'Automatically save a set amount on payday.'
    ),
    values: { budgeting: 5, saving: 12, debt: 2 },
  },
  {
    id: 'emergency-fund',
    text: () => 'Save $1,000 first, then 3 to 6 months of costs.',
    values: { budgeting: 5, saving: 13, debt: 5 },
  },
  {
    id: 'high-interest-first',
    text: () => 'Put extra cash on the highest-interest debt.',
    values: { budgeting: 2, saving: 2, debt: 13 },
  },
  {
    id: 'freeze-card',
    text: () => 'Stop adding new charges to the credit card.',
    values: { budgeting: 2, saving: 2, debt: 12 },
  },
  {
    id: 'save-leftovers',
    text: () => 'Save whatever is left at the end of the month.',
    values: { budgeting: 2, saving: 2, debt: 0 },
  },
];
