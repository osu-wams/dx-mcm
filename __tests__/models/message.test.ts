import Message, { Status } from '@src/models/message';
import {
  dynamoDbMessage,
  message,
  messageStatus,
  emptyMessage,
  emptyDynamoDbMessage,
} from '@mocks/message.mock';

const mockQuery = jest.fn();
const mockPutItem = jest.fn();
jest.mock('@src/database', () => ({
  // @ts-ignore
  ...jest.requireActual('@src/database'),
  createTable: () => jest.fn(),
  query: () => mockQuery(),
  putItem: () => mockPutItem(),
}));

describe('Message', () => {
  describe('constructor', () => {
    it('builds a dynamodb item from a message', () => {
      const model = new Message({ message });
      expect(Message.asDynamoDbItem(model)).toStrictEqual(dynamoDbMessage);
    });
    it('builds a message from a dynamodb item', () => {
      const model = new Message({ dynamoDbMessage });
      expect(model).toEqual(message);
    });
    it('builds an empty message from an empty dynamodb item', () => {
      const model = new Message({ dynamoDbMessage: emptyDynamoDbMessage });
      expect(model).toEqual(emptyMessage);
    });
    it('builds an invalid empty message from an empty dynamodb item', () => {
      const model = new Message({ dynamoDbMessage: {} });
      expect(model).toEqual(new Message({}));
    });
  });

  describe('find', () => {
    it('does not find a matching record', async () => {
      mockQuery.mockResolvedValue({ Items: undefined });
      expect(await Message.find('1492-01-01', 'bogus-id')).toBe(undefined);
    });
    it('finds a matching record', async () => {
      mockQuery.mockResolvedValue({ Items: [dynamoDbMessage] });
      expect(await Message.find('2020-01-01', '123456789')).toEqual(message);
    });
    it('throws an error when there is a unhandled exception', async () => {
      mockQuery.mockRejectedValue('boom');
      try {
        await Message.find('2020-01-01', '123456789');
      } catch (err) {
        expect(err).toBe('boom');
      }
    });
  });

  describe('findAll', () => {
    it('does not find any matching records', async () => {
      mockQuery.mockResolvedValue({ Items: undefined });
      expect(await Message.findAll('1492-01-01')).toStrictEqual([]);
    });
    it('finds all matching records', async () => {
      mockQuery.mockResolvedValue({ Items: [dynamoDbMessage, dynamoDbMessage] });
      expect(await Message.findAll('2020-01-01')).toEqual([message, message]);
    });
    it('throws an error when there is a unhandled exception', async () => {
      mockQuery.mockRejectedValue('boom');
      try {
        await Message.findAll('2020-01-01');
      } catch (err) {
        expect(err).toBe('boom');
      }
    });
  });

  describe('upsert', () => {
    it('creates a new record', async () => {
      mockPutItem.mockResolvedValue(message);
      mockQuery.mockResolvedValue({ Items: [dynamoDbMessage] });
      expect(await Message.upsert(message)).toEqual(message);
    });
    it('throws an error when there is a unhandled exception', async () => {
      mockPutItem.mockRejectedValue('boom');
      try {
        await Message.upsert(message);
      } catch (err) {
        expect(err).toBe('boom');
      }
    });
  });

  describe('byStatusBeforeDate', () => {
    it('does not find any matching records', async () => {
      mockQuery.mockResolvedValue({ Items: undefined });
      expect(await Message.byStatusBeforeDate(Status.NEW, '1492-01-01')).toStrictEqual([]);
    });
    it('finds all matching records', async () => {
      mockQuery.mockResolvedValue({ Items: [dynamoDbMessage, dynamoDbMessage] });
      expect(await Message.byStatusBeforeDate(Status.NEW, '2222-01-01')).toEqual([
        messageStatus,
        messageStatus,
      ]);
    });
    it('throws an error when there is a unhandled exception', async () => {
      mockQuery.mockRejectedValue('boom');
      try {
        await Message.byStatusBeforeDate(Status.NEW, '2222-01-01');
      } catch (err) {
        expect(err).toBe('boom');
      }
    });
  });
});
