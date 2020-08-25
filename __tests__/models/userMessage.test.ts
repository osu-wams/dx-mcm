import UserMessage, { Status, channelExists } from '@src/models/userMessage';
import {
  dynamoDbUserMessage,
  userMessage,
  emptyUserMessage,
  emptyDynamoDbUserMessage,
} from '@mocks/userMessage.mock';

const mockQuery = jest.fn();
const mockPutItem = jest.fn();
const mockUpdateItem = jest.fn();
jest.mock('@src/database', () => ({
  // @ts-ignore
  ...jest.requireActual('@src/database'),
  createTable: () => jest.fn(),
  query: () => mockQuery(),
  putItem: () => mockPutItem(),
  updateItem: () => mockUpdateItem(),
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
      expect(await UserMessage.find('123456789', 'bogus-id', '123')).toEqual({
        count: 0,
        items: [],
      });
    });
    it('finds a matching record', async () => {
      mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessage], Count: 1 });
      expect(await UserMessage.find('123456789', 'message-123456789', '123')).toEqual({
        count: 1,
        items: [userMessage],
        lastKey: undefined,
      });
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
      expect(await UserMessage.findAll('123456789')).toStrictEqual({ count: 0, items: [] });
    });
    it('finds all matching records', async () => {
      mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessage, dynamoDbUserMessage], Count: 2 });
      expect(await UserMessage.findAll('123456789')).toEqual({
        count: 2,
        items: [userMessage, userMessage],
      });
    });
    it('finds matching records with additional page of results', async () => {
      mockQuery.mockResolvedValue({
        Items: [dynamoDbUserMessage, dynamoDbUserMessage],
        Count: 2,
        LastEvaluatedKey: {
          osuId: dynamoDbUserMessage.osuId,
          statusSendAt: dynamoDbUserMessage.statusSendAt,
          channelMessageId: dynamoDbUserMessage.channelMessageId,
        },
      });
      expect(await UserMessage.findAll('123456789')).toEqual({
        count: 2,
        items: [userMessage, userMessage],
        lastKey:
          'eyJvc3VJZCI6eyJTIjoiMTIzNDU2Nzg5In0sInN0YXR1c1NlbmRBdCI6eyJTIjoiTkVXOjIwMjAtMDEtMDEifSwiY2hhbm5lbE1lc3NhZ2VJZCI6eyJTIjoiZGFzaGJvYXJkOm1lc3NhZ2UtMTIzNDU2Nzg5In19',
      });
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
      mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessage], Count: 1 });
      expect(await UserMessage.upsert(userMessage)).toEqual({ count: 1, items: [userMessage] });
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
      expect(await UserMessage.byStatus('123456789', Status.NEW)).toStrictEqual({
        count: 0,
        items: [],
      });
    });
    it('finds all matching records', async () => {
      mockQuery.mockResolvedValue({
        Items: [
          { ...dynamoDbUserMessage, channelMessageId: { S: userMessage.channelMessageId } },
          { ...dynamoDbUserMessage, channelMessageId: { S: userMessage.channelMessageId } },
        ],
        Count: 2,
      });
      expect(await UserMessage.byStatus('123456789', Status.NEW)).toEqual({
        count: 2,
        items: [userMessage, userMessage],
      });
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

  describe('updateStatus', () => {
    it('updates the status of a new record', async () => {
      mockUpdateItem.mockResolvedValue(userMessage);
      mockQuery.mockResolvedValue({ Items: [{ ...dynamoDbUserMessage, status: { S: 'READ' } }] });
      const original = { ...userMessage }; // cause a new object to be created with original values, userMessage gets mutated
      const updated = await UserMessage.updateStatus(userMessage, Status.READ);
      console.log(updated);
      expect(updated.items[0].status).not.toEqual(original.status);
      expect(updated.items[0].status).toEqual(Status.READ);
    });
    it('throws an error when there is a unhandled exception', async () => {
      mockUpdateItem.mockRejectedValue('boom');
      try {
        await UserMessage.updateStatus(userMessage, Status.READ);
      } catch (err) {
        expect(err).toBe('boom');
      }
    });
  });

  describe('channelExists', () => {
    it('should find an existing channel', async () => {
      expect(channelExists(userMessage)).toBeTruthy();
    });
    it('should not find a nonexistent channel', async () => {
      expect(channelExists({ ...userMessage, channelId: 'doesnotexist' })).toBeFalsy();
    });
  });
});
