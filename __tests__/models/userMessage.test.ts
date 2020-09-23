import UserMessage, { Status, channelExists } from '@src/models/userMessage';
import {
  dynamoDbUserMessage,
  userMessage as userMessageMock,
  emptyUserMessage,
  emptyDynamoDbUserMessage,
} from '@mocks/userMessage.mock';

const mockQuery = jest.fn();
const mockPutItem = jest.fn();
const mockUpdateItem = jest.fn();
const mockDeleteItem = jest.fn();
jest.mock('@src/database', () => ({
  // @ts-ignore
  ...jest.requireActual('@src/database'),
  createTable: () => jest.fn(),
  query: () => mockQuery(),
  putItem: () => mockPutItem(),
  updateItem: () => mockUpdateItem(),
  deleteItem: () => mockDeleteItem(),
}));

let userMessage: UserMessage;
beforeEach(() => {
  userMessage = new UserMessage({ userMessage: userMessageMock });
});

describe('UserMessage', () => {
  describe('constructor', () => {
    it('builds a dynamodb item from a userMessage', () => {
      expect(userMessage.asDynamoDbItem()).toStrictEqual(dynamoDbUserMessage);
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
      expect(
        await UserMessage.find({ id: '123456789', messageId: 'bogus-id', channelId: '123' }),
      ).toEqual({
        count: 0,
        items: [],
      });
    });
    it('finds a matching record', async () => {
      mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessage], Count: 1 });
      expect(
        await UserMessage.find({ id: '123456789', messageId: 'bogus-id', channelId: '123' }),
      ).toEqual({
        count: 1,
        items: [userMessage],
        lastKey: undefined,
      });
    });
    it('throws an error when there is a unhandled exception', async () => {
      mockQuery.mockRejectedValue('boom');
      try {
        await UserMessage.find({ id: '123456789', messageId: 'bogus-id', channelId: '123' });
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
          id: dynamoDbUserMessage.id,
          channelMessageId: dynamoDbUserMessage.channelMessageId,
        },
      });
      expect(await UserMessage.findAll('123456789')).toEqual({
        count: 2,
        items: [userMessage, userMessage],
        lastKey:
          'eyJpZCI6eyJTIjoiYm9icm9zcyJ9LCJjaGFubmVsTWVzc2FnZUlkIjp7IlMiOiJkYXNoYm9hcmQjbWVzc2FnZS0xMjM0NTY3ODkifX0.',
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
      userMessage.channelId = 'doesnotexist';
      expect(channelExists(userMessage)).toBeFalsy();
    });
  });

  describe('delete', () => {
    it('deletes a new record', async () => {
      mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessage], Count: 1 });
      mockDeleteItem.mockResolvedValue(userMessage);
      expect(
        await UserMessage.delete({
          id: userMessage.id,
          messageId: userMessage.messageId,
          channelId: userMessage.channelId,
        }),
      ).toBeTruthy();
    });
    it('returns true when the item is not found', async () => {
      mockQuery.mockResolvedValue({ Items: [], Count: 0 });
      mockDeleteItem.mockResolvedValue(userMessage);
      expect(
        await UserMessage.delete({
          id: userMessage.id,
          messageId: userMessage.messageId,
          channelId: userMessage.channelId,
        }),
      ).toBeTruthy();
    });
    it('throws an error when there is a unhandled exception', async () => {
      mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessage], Count: 1 });
      mockDeleteItem.mockRejectedValue('boom');
      try {
        await UserMessage.delete({
          id: userMessage.id,
          messageId: userMessage.messageId,
          channelId: userMessage.channelId,
        });
      } catch (err) {
        expect(err).toBe('boom');
      }
    });
  });
});
