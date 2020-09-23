import UserMessagePending from '@src/models/userMessagePending';
import {
  dynamoDbUserMessagePending,
  userMessagePending as userMessagePendingMock,
  emptyUserMessagePending,
  emptyDynamoDbUserMessagePending,
} from '@mocks/userMessage.mock';

const mockQuery = jest.fn();
const mockPutItem = jest.fn();
jest.mock('@src/database', () => ({
  // @ts-ignore
  ...jest.requireActual('@src/database'),
  createTable: () => jest.fn(),
  query: () => mockQuery(),
  putItem: () => mockPutItem(),
}));

let userMessagePending: UserMessagePending;
beforeEach(() => {
  userMessagePending = new UserMessagePending({ userMessage: userMessagePendingMock });
});

describe('UserMessagePendingPending', () => {
  describe('constructor', () => {
    it('builds a dynamodb item from a userMessagePending', () => {
      expect(userMessagePending.asDynamoDbItem()).toStrictEqual(dynamoDbUserMessagePending);
    });
    it('builds a userMessagePending from a dynamodb item', () => {
      const model = new UserMessagePending({ dynamoDbUserMessage: dynamoDbUserMessagePending });
      expect(model).toEqual(userMessagePending);
    });
    it('builds an empty userMessagePending from an empty dynamodb item', () => {
      const model = new UserMessagePending({
        dynamoDbUserMessage: emptyDynamoDbUserMessagePending,
      });
      expect(model).toEqual(emptyUserMessagePending);
    });
    it('builds an invalid empty userMessagePending from an empty dynamodb item', () => {
      const model = new UserMessagePending({ dynamoDbUserMessage: {} });
      expect(model).toEqual(new UserMessagePending({}));
    });
  });

  describe('find', () => {
    it('does not find a matching record', async () => {
      mockQuery.mockResolvedValue({ Items: undefined });
      expect(
        await UserMessagePending.find({ id: '123456789', messageId: 'bogus-id', channelId: '123' }),
      ).toEqual({
        count: 0,
        items: [],
      });
    });
    it('finds a matching record', async () => {
      mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessagePending], Count: 1 });
      expect(
        await UserMessagePending.find({ id: '123456789', messageId: 'bogus-id', channelId: '123' }),
      ).toEqual({
        count: 1,
        items: [userMessagePending],
        lastKey: undefined,
      });
    });
    it('throws an error when there is a unhandled exception', async () => {
      mockQuery.mockRejectedValue('boom');
      try {
        await UserMessagePending.find({ id: '123456789', messageId: 'bogus-id', channelId: '123' });
      } catch (err) {
        expect(err).toBe('boom');
      }
    });
  });

  describe('upsert', () => {
    it('creates a new record', async () => {
      mockPutItem.mockResolvedValue(userMessagePending);
      mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessagePending], Count: 1 });
      expect(await UserMessagePending.upsert(userMessagePending)).toEqual({
        count: 1,
        items: [userMessagePending],
      });
    });
    it('throws an error when there is a unhandled exception', async () => {
      mockPutItem.mockRejectedValue('boom');
      try {
        await UserMessagePending.upsert(userMessagePending);
      } catch (err) {
        expect(err).toBe('boom');
      }
    });
  });

  describe('byMessage', () => {
    it('does not find a matching record', async () => {
      mockQuery.mockResolvedValue({ Items: undefined });
      expect(await UserMessagePending.byMessage('ERROR', 'bogus-id')).toEqual({
        count: 0,
        items: [],
      });
    });
    it('finds a matching record', async () => {
      mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessagePending], Count: 1 });
      expect(await UserMessagePending.byMessage('ERROR', 'bogus-id')).toEqual({
        count: 1,
        items: [userMessagePending],
        lastKey: undefined,
      });
    });
    it('throws an error when there is a unhandled exception', async () => {
      mockQuery.mockRejectedValue('boom');
      try {
        await UserMessagePending.byMessage('123456789', 'bogus-id');
      } catch (err) {
        expect(err).toBe('boom');
      }
    });
  });
});
