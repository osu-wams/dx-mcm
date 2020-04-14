import { handler } from '@src/services/messages/snsMessagesCreate';
import { dynamoDbMessage, message } from '@mocks/message.mock';
import * as event from '../../../events/lambda.sns.messagesCreate.json';

const mockCreateTable = jest.fn();
const mockQuery = jest.fn();
const mockPutItem = jest.fn();
jest.mock('@src/database', () => ({
  ...jest.requireActual('@src/database'),
  createTable: () => mockCreateTable(),
  query: () => mockQuery(),
  putItem: () => mockPutItem(),
}));

const mockGetQueueUrl = jest.fn();
const mockSendMessage = jest.fn();
jest.mock('@src/messageQueue', () => ({
  ...jest.requireActual('@src/messageQueue'),
  sendMessage: () => mockSendMessage(),
  getQueueUrl: () => mockGetQueueUrl(),
}));

describe('handler', () => {
  it('creates a new record', async () => {
    mockPutItem.mockResolvedValue(message);
    mockQuery.mockResolvedValue({ Items: [dynamoDbMessage] });
    mockGetQueueUrl.mockResolvedValue({ QueueUrl: 'some-url' });
    const result = await handler(event);
    expect(result).toEqual(undefined);
    expect(mockGetQueueUrl).toHaveBeenCalled();
    expect(mockSendMessage).toHaveBeenCalled();
  });
  it('throws an error when there is a unhandled exception', async () => {
    mockPutItem.mockRejectedValue('boom');
    try {
      await handler(event);
    } catch (err) {
      expect(err).toBe('boom');
    }
  });
});
