import { handler } from '@src/services/messages/api/main';
import { message, dynamoDbMessage } from '@mocks/message.mock';
import { mockRedisError, mockRedisResponse } from '../../../__mocks__/redis';
import * as findByIdEvent from '../../../events/lambda.http.messageApi.findById.json';
import * as cachedGroupsEvent from '../../../events/lambda.http.messageApi.cachedGroups.json';
import * as updateEvent from '../../../events/lambda.http.messageApi.update.json';
import * as cancelEvent from '../../../events/lambda.http.messageApi.cancel.json';

const mockEvent = jest.fn();
const mockQuery = jest.fn();
const mockPutItem = jest.fn();
jest.mock('@src/database', () => ({
  // @ts-ignore
  ...jest.requireActual('@src/database'),
  createTable: () => jest.fn(),
  query: () => mockQuery(),
  putItem: () => mockPutItem(),
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
  describe('findById', () => {
    beforeEach(() => {
      mockEvent.mockReturnValue(JSON.parse(JSON.stringify(findByIdEvent)));
    });

    it('finds a record', async () => {
      mockQuery.mockResolvedValue({ Items: [dynamoDbMessage], Count: 1 });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(JSON.stringify({ message }));
      expect(mockPutItem).not.toHaveBeenCalled();
    });
    it('does not find a record', async () => {
      mockQuery.mockResolvedValue({ Items: [], Count: 0 });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(400);
      expect(response.body).toBe(JSON.stringify({ error: 'Message 123456789 not found.' }));
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

  describe('update', () => {
    beforeEach(() => {
      mockEvent.mockReturnValue(JSON.parse(JSON.stringify(updateEvent)));
    });

    it('updates a record', async () => {
      mockQuery
        .mockResolvedValueOnce({ Items: [dynamoDbMessage], Count: 1 })
        .mockResolvedValueOnce({
          Items: [{ ...dynamoDbMessage, status: { S: 'CANCELLED' } }],
          Count: 1,
        });
      mockPutItem.mockResolvedValue({ ...message, status: 'CANCELLED' });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(JSON.stringify({ message: { ...message, status: 'CANCELLED' } }));
      expect(mockPutItem).toHaveBeenCalled();
    });
    it('does not find a record to update', async () => {
      mockQuery.mockResolvedValue({ Items: [], Count: 0 });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(400);
      expect(response.body).toBe(JSON.stringify({ error: 'Message 123456789 not found.' }));
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

  describe('cancel', () => {
    beforeEach(() => {
      mockEvent.mockReturnValue(JSON.parse(JSON.stringify(cancelEvent)));
    });

    it('cancels a record', async () => {
      mockQuery
        .mockResolvedValueOnce({ Items: [dynamoDbMessage], Count: 1 })
        .mockResolvedValueOnce({
          Items: [{ ...dynamoDbMessage, status: { S: 'CANCELLED' } }],
          Count: 1,
        });
      mockPutItem.mockResolvedValue({ ...message, status: 'CANCELLED' });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(JSON.stringify({ message: { ...message, status: 'CANCELLED' } }));
      expect(mockPutItem).toHaveBeenCalled();
    });
    it('cannot cancel a message that was already sent', async () => {
      mockQuery.mockResolvedValueOnce({
        Items: [{ ...dynamoDbMessage, status: { S: 'SENT' } }],
        Count: 1,
      });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(400);
      expect(response.body).toBe(
        JSON.stringify({ error: 'Message 123456789 has already been sent.' }),
      );
      expect(mockPutItem).not.toHaveBeenCalled();
    });
    it('does not find a record to update', async () => {
      mockQuery.mockResolvedValue({ Items: [], Count: 0 });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(400);
      expect(response.body).toBe(JSON.stringify({ error: 'Message 123456789 not found.' }));
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

  describe('groups', () => {
    beforeEach(() => {
      mockEvent.mockReturnValue(JSON.parse(JSON.stringify(cachedGroupsEvent)));
    });

    it('finds a cached group', async () => {
      const fromCache = JSON.stringify({ count: 1, date: '2020-04-20' });
      const expected = JSON.stringify({ 'all-students': { count: 1, date: '2020-04-20' } });
      mockRedisResponse.mockReturnValueOnce(fromCache).mockReturnValue('');
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(expected);
      expect(mockRedisResponse).toBeCalledTimes(11);
    });
    it('finds all of the cached groups', async () => {
      const fromCache = JSON.stringify({ count: 1, date: '2020-04-20' });
      const expected = JSON.stringify({
        'all-students': { count: 1, date: '2020-04-20' },
        'ecampus-students': { count: 1, date: '2020-04-20' },
        'cascades-students': { count: 1, date: '2020-04-20' },
        'corvallis-students': { count: 1, date: '2020-04-20' },
        'portland-students': { count: 1, date: '2020-04-20' },
        'lagrande-students': { count: 1, date: '2020-04-20' },
        'into-students': { count: 1, date: '2020-04-20' },
        'undergraduate-students': { count: 1, date: '2020-04-20' },
        'graduate-students': { count: 1, date: '2020-04-20' },
        'all-employees': { count: 1, date: '2020-04-20' },
        'non-student-employees': { count: 1, date: '2020-04-20' },
      });
      mockRedisResponse.mockReturnValue(fromCache);
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(expected);
      expect(mockRedisResponse).toBeCalledTimes(11);
    });

    it('returns an error', async () => {
      mockRedisError.mockReturnValue({ message: 'error' });
      const response = await handler(mockEvent(), mockContext);
      expect(response.statusCode).toBe(500);
      expect(response.body).toBe(JSON.stringify({ message: 'error', data: null }));
    });
  });
});
