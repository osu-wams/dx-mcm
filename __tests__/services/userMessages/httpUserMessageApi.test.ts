import { handler } from '@src/services/userMessages/api/main';
import {
  userMessage,
  dynamoDbUserMessage,
  userMessagePending,
  dynamoDbUserMessagePending,
} from '@mocks/userMessage.mock';
import * as findByChannelEvent from '../../../events/lambda.http.userMessageApi.findByChannel.json';
import * as markReadEvent from '../../../events/lambda.http.userMessageApi.markRead.json';
import * as findErrorEvent from '../../../events/lambda.http.userMessageApi.findError.json';
import * as findByStatusEvent from '../../../events/lambda.http.userMessageApi.findByStatus.json';
import * as markAllReadEvent from '../../../events/lambda.http.userMessageApi.markAllRead.json';

const mockEvent = jest.fn();

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

const mockContext: AWSLambda.Context = {
  awsRequestId: '',
  callbackWaitsForEmptyEventLoop: true,
  functionName: '',
  functionVersion: '1',
  getRemainingTimeInMillis: jest.fn(() => 1),
  invokedFunctionArn: '',
  logGroupName: '',
  logStreamName: '',
  memoryLimitInMB: '1024',
  done: jest.fn(),
  fail: jest.fn(),
  succeed: jest.fn(),
};

describe('handler', () => {
  describe('findByChannel', () => {
    beforeEach(() => {
      mockEvent.mockReturnValue(JSON.parse(JSON.stringify(findByChannelEvent)));
    });

    it('finds a record', async () => {
      mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessage], Count: 1 });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(
        JSON.stringify({
          action: 'user-messages-find-by-channel',
          object: { userMessageResults: { items: [userMessage], count: 1 } },
        }),
      );
      expect(mockPutItem).not.toHaveBeenCalled();
    });
    it('does not find a record', async () => {
      mockQuery.mockResolvedValue({ Items: [], Count: 0 });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(
        JSON.stringify({
          action: 'user-messages-find-by-channel',
          object: { userMessageResults: { items: [], count: 0 } },
        }),
      );
      expect(mockPutItem).not.toHaveBeenCalled();
    });
    it('returns an error', async () => {
      mockQuery.mockRejectedValue({ message: 'error' });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(500);
      expect(response.body).toBe(JSON.stringify({ message: 'error', data: null }));
      expect(mockPutItem).not.toHaveBeenCalled();
    });
  });

  describe('markRead', () => {
    beforeEach(() => {
      mockEvent.mockReturnValue(JSON.parse(JSON.stringify(markReadEvent)));
    });

    it('updates a record', async () => {
      mockQuery
        .mockResolvedValueOnce({ Items: [dynamoDbUserMessage], Count: 1 })
        .mockResolvedValueOnce({
          Items: [{ ...dynamoDbUserMessage, status: { S: 'READ' } }],
          Count: 1,
        });
      mockUpdateItem.mockResolvedValue({ ...userMessage, status: 'READ' });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(
        JSON.stringify({
          action: 'user-message-mark-read',
          object: { userMessage: { ...userMessage, status: 'READ' } },
        }),
      );
      expect(mockUpdateItem).toHaveBeenCalled();
    });
    it('does not find a record to update', async () => {
      mockQuery.mockResolvedValue({ Items: [], Count: 0 });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(409);
      expect(response.body).toBe(
        JSON.stringify({
          action: 'user-message-mark-read',
          message: 'Mark message as read failed.',
        }),
      );
      expect(mockUpdateItem).not.toHaveBeenCalled();
    });
    it('returns an error', async () => {
      mockQuery.mockRejectedValue({ message: 'error' });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(500);
      expect(response.body).toBe(JSON.stringify({ message: 'error', data: null }));
      expect(mockPutItem).not.toHaveBeenCalled();
    });
  });

  describe('findByStatus', () => {
    beforeEach(() => {
      mockEvent.mockReturnValue(JSON.parse(JSON.stringify(findByStatusEvent)));
    });

    it('finds a record', async () => {
      mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessagePending], Count: 1 });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(
        JSON.stringify({
          action: 'user-message-pending-find-by-status',
          object: { userMessageResults: { items: [userMessagePending], count: 1 } },
        }),
      );
      expect(mockPutItem).not.toHaveBeenCalled();
    });
    it('does not find a record', async () => {
      mockQuery.mockResolvedValue({ Items: [], Count: 0 });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(
        JSON.stringify({
          action: 'user-message-pending-find-by-status',
          object: { userMessageResults: { items: [], count: 0 } },
        }),
      );
      expect(mockPutItem).not.toHaveBeenCalled();
    });
    it('returns an error', async () => {
      mockQuery.mockRejectedValue({ message: 'error' });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(500);
      expect(response.body).toBe(JSON.stringify({ message: 'error', data: null }));
      expect(mockPutItem).not.toHaveBeenCalled();
    });
  });

  describe('findError', () => {
    beforeEach(() => {
      mockEvent.mockReturnValue(JSON.parse(JSON.stringify(findErrorEvent)));
    });

    it('finds a record', async () => {
      mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessagePending], Count: 1 });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(
        JSON.stringify({
          action: 'user-message-pending-find-error',
          object: { userMessageResults: { items: [userMessagePending], count: 1 } },
        }),
      );
      expect(mockPutItem).not.toHaveBeenCalled();
    });
    it('does not find a record', async () => {
      mockQuery.mockResolvedValue({ Items: [], Count: 0 });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(
        JSON.stringify({
          action: 'user-message-pending-find-error',
          object: { userMessageResults: { items: [], count: 0 } },
        }),
      );
      expect(mockPutItem).not.toHaveBeenCalled();
    });
    it('returns an error', async () => {
      mockQuery.mockRejectedValue({ message: 'error' });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(500);
      expect(response.body).toBe(JSON.stringify({ message: 'error', data: null }));
      expect(mockPutItem).not.toHaveBeenCalled();
    });
  });

  describe.only('markAllRead', () => {
    beforeEach(() => {
      mockEvent.mockReturnValue(JSON.parse(JSON.stringify(markAllReadEvent)));
    });

    it('updates a record', async () => {
      mockQuery
        .mockResolvedValueOnce({ Items: [dynamoDbUserMessage], Count: 1 })
        .mockResolvedValueOnce({
          Items: [{ ...dynamoDbUserMessage, status: { S: 'READ' } }],
          Count: 1,
        });
      mockUpdateItem.mockResolvedValue({ ...userMessage, status: 'READ' });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(
        JSON.stringify({
          action: 'user-messages-mark-all-read',
          message: '1 marked as read.',
        }),
      );
      expect(mockUpdateItem).toHaveBeenCalled();
    });
    it('updates many records', async () => {
      mockQuery
        .mockResolvedValueOnce({ Items: [dynamoDbUserMessage, dynamoDbUserMessage], Count: 2 })
        .mockResolvedValue({
          Items: [{ ...dynamoDbUserMessage, status: { S: 'READ' } }],
          Count: 1,
        });
      mockUpdateItem.mockResolvedValue({ ...userMessage, status: 'READ' });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(
        JSON.stringify({
          action: 'user-messages-mark-all-read',
          message: '2 marked as read.',
        }),
      );
      expect(mockUpdateItem).toHaveBeenCalled();
    });
    it('does not find a record to update', async () => {
      mockQuery.mockResolvedValue({ Items: [], Count: 0 });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(
        JSON.stringify({
          action: 'user-messages-mark-all-read',
          message: '0 marked as read.',
        }),
      );
      expect(mockUpdateItem).not.toHaveBeenCalled();
    });
    it('returns an error', async () => {
      mockQuery.mockRejectedValue({ message: 'error' });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(500);
      expect(response.body).toBe(JSON.stringify({ message: 'error', data: null }));
      expect(mockPutItem).not.toHaveBeenCalled();
    });
  });
});
