// Numbers Nessie does not store. getScenario merges these into facts.
// A later live-Nessie version of getScenario should keep using this file.
export const CUSTOMER_EXTRAS = {
  budgeting: {
    merchantLabels: {
      'Noodle Nest': 'takeout',
      StreamStack: 'subscriptions',
    },
    daysUntilPayday: 6,
  },
  saving: {
    emergencyFundMonths: 3,
    savingsHabit: false,
  },
  debt: {
    creditCardApr: 24.99,
    creditCardMinPayment: 70,
    interestPortionOfMinimum: 50,
    loanBalance: 8000,
    loanApr: 6.5,
    loanPayment: 180,
  },
};
