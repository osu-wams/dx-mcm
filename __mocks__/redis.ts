/* eslint-disable */
const redis = jest.genMockFromModule('redis') as any;

export const mockRedisResponse = jest.fn();
export const mockRedisError = jest.fn();

const createClient = () => ({
  flushdb: () => {
    // mocked flushdb is a no-op
  },
  on: () => {
    // mocked on is a no-op
  },
  // @ts-ignore
  get: jest.fn((key, cb) => cb(mockRedisError(), mockRedisResponse())),
  // @ts-ignore
  set: jest.fn((key, data, mode, duration, flag, cb) => cb(mockRedisError(), mockRedisResponse())),
  // @ts-ignore
  select: jest.fn((key, cb) => cb(mockRedisError(), mockRedisResponse())),
});

redis.createClient = createClient;
export default redis;
