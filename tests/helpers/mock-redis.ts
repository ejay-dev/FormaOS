export function mockRedis() {
  const pipeline = {
    get: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    incr: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };

  return {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
    incr: jest.fn(),
    ttl: jest.fn(),
    expire: jest.fn(),
    pipeline: jest.fn(() => pipeline),
    _pipeline: pipeline,
  };
}

