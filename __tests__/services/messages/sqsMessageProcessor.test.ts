import { handler } from '@src/services/messages/sqsMessageProcessor';
// import { dynamoDbMessage } from '@mocks/message.mock';
import * as event from '../../../events/lambda.sqs.messageProcessor.json';

/*
const mockCreateTable = jest.fn();
const mockQuery = jest.fn();
const mockPutItem = jest.fn();
jest.mock('@src/database', () => ({
  ...jest.requireActual('@src/database'),
  createTable: () => mockCreateTable(),
  query: () => mockQuery(),
  putItem: () => mockPutItem(),
}));
*/

const mockGetQueueUrl = jest.fn();
const mockSendMessage = jest.fn();
jest.mock('@src/messageQueue', () => ({
  ...jest.requireActual('@src/messageQueue'),
  sendMessage: () => mockSendMessage(),
  getQueueUrl: () => mockGetQueueUrl(),
}));

describe('handler', () => {
  it('publishes pending messages to the queue', async () => {
    mockGetQueueUrl.mockResolvedValue({ QueueUrl: 'some-url' });
    const result = await handler(event);
    expect(result).toEqual(undefined);
    expect(mockGetQueueUrl).toHaveBeenCalled();
    expect(mockSendMessage).toHaveBeenCalled();
  });
  it('throws an error when there is a unhandled exception', async () => {
    mockGetQueueUrl.mockRejectedValue('boom');
    try {
      await handler(event);
    } catch (err) {
      expect(err).toBe('boom');
    }
  });
});
