// Data Nessie does not store. Amounts here are copied into scenario facts
// before any issue text is written, so the sentences only read those facts.

export const NEEDS_CATEGORIES = ['rent', 'groceries', 'utilities', 'transport'];

export const WANTS_CATEGORIES = [
  'takeout',
  'dining',
  'subscriptions',
  'rideshare',
  'shopping',
  'entertainment',
];

// How many subscriptions each customer pays for. Maya is budgeting, Jordan is saving.
export const SUBSCRIPTION_COUNTS = {
  budgeting: 6,
  saving: 3,
};

// Sam, the debt customer. The credit card balance comes from Nessie.
export const DEBT_TERMS = {
  creditCardApr: 24,
  creditCardMinPayment: 105,
  interestPortionOfMinimum: 84,
  loanBalance: 6000,
  loanApr: 7,
  loanPayment: 180,
  extraCash: 250,
};
