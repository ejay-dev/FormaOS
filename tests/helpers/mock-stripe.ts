export function mockStripe() {
  return {
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      list: jest.fn(),
    },
    subscriptions: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
      list: jest.fn(),
    },
    invoices: {
      create: jest.fn(),
      retrieve: jest.fn(),
      list: jest.fn(),
      pay: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  };
}

