import UserMessage, { Status } from '@src/models/userMessage';
import {
  dynamoDbUserMessage,
  userMessage,
  userMessageStatus,
  emptyUserMessage,
  emptyDynamoDbUserMessage,
} from '@mocks/userMessage.mock';

const mockCreateTable = jest.fn();
const mockQuery = jest.fn();
const mockPutItem = jest.fn();
jest.mock('@src/database', () => ({
  ...jest.requireActual('@src/database'),
  createTable: () => mockCreateTable(),
  query: () => mockQuery(),
  putItem: () => mockPutItem(),
}));

describe('UserMessage', () => {
  describe('constructor', () => {
    it('builds a dynamodb item from a userMessage', () => {
      const model = new UserMessage({ userMessage });
      expect(UserMessage.asDynamoDbItem(model)).toStrictEqual(dynamoDbUserMessage);
    });
    it('builds a userMessage from a dynamodb item', () => {
      const model = new UserMessage({ dynamoDbUserMessage });
      expect(model).toEqual(userMessage);
    });
    it('builds an empty userMessage from an empty dynamodb item', () => {
      const model = new UserMessage({ dynamoDbUserMessage: emptyDynamoDbUserMessage });
      expect(model).toEqual(emptyUserMessage);
    });
    it('builds an invalid empty userMessage from an empty dynamodb item', () => {
      const model = new UserMessage({ dynamoDbUserMessage: {} });
      expect(model).toEqual(new UserMessage({}));
    });
  });

  describe('find', () => {
    it('does not find a matching record', async () => {
      mockQuery.mockResolvedValue({ Items: undefined });
      expect(await UserMessage.find('123456789', 'bogus-id', '123')).toBe(undefined);
    });
    it('finds a matching record', async () => {
      mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessage] });
      expect(await UserMessage.find('123456789', 'message-123456789', '123')).toEqual(userMessage);
    });
    it('throws an error when there is a unhandled exception', async () => {
      mockQuery.mockRejectedValue('boom');
      try {
        await UserMessage.find('123456789', 'message-123456789', '123');
      } catch (err) {
        expect(err).toBe('boom');
      }
    });
  });

  describe('findAll', () => {
    it('does not find any matching records', async () => {
      mockQuery.mockResolvedValue({ Items: undefined });
      expect(await UserMessage.findAll('123456789')).toStrictEqual([]);
    });
    it('finds all matching records', async () => {
      mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessage, dynamoDbUserMessage] });
      expect(await UserMessage.findAll('123456789')).toEqual([userMessage, userMessage]);
    });
    it('throws an error when there is a unhandled exception', async () => {
      mockQuery.mockRejectedValue('boom');
      try {
        await UserMessage.findAll('123456789');
      } catch (err) {
        expect(err).toBe('boom');
      }
    });
  });

  describe('upsert', () => {
    it('creates a new record', async () => {
      mockPutItem.mockResolvedValue(userMessage);
      mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessage] });
      expect(await UserMessage.upsert(userMessage)).toEqual(userMessage);
    });
    it('throws an error when there is a unhandled exception', async () => {
      mockPutItem.mockRejectedValue('boom');
      try {
        await UserMessage.upsert(userMessage);
      } catch (err) {
        expect(err).toBe('boom');
      }
    });
  });

  describe('byStatus', () => {
    it('does not find any matching records', async () => {
      mockQuery.mockResolvedValue({ Items: undefined });
      expect(await UserMessage.byStatus('123456789', Status.NEW)).toStrictEqual([]);
    });
    it('finds all matching records', async () => {
      mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessage, dynamoDbUserMessage] });
      expect(await UserMessage.byStatus('123456789', Status.NEW)).toEqual([
        userMessageStatus,
        userMessageStatus,
      ]);
    });
    it('throws an error when there is a unhandled exception', async () => {
      mockQuery.mockRejectedValue('boom');
      try {
        await UserMessage.byStatus('123456789', Status.NEW);
      } catch (err) {
        expect(err).toBe('boom');
      }
    });
  });
});
