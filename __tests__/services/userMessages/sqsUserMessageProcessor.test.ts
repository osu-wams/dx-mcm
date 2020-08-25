import { handler } from '@src/services/userMessages/sqsUserMessageProcessor';
import { userMessage } from '@mocks/userMessage.mock';

const mockQuery = jest.fn();
const mockPutItem = jest.fn();
const mockUpdateItem = jest.fn();
jest.mock('@src/database', () => ({
  // @ts-ignore
  ...jest.requireActual('@src/database'),
  query: () => mockQuery(),
  putItem: () => mockPutItem(),
  updateItem: () => mockUpdateItem(),
}));

const mockGetQueueUrl = jest.fn();
const mockSendMessage = jest.fn();
jest.mock('@src/messageQueue', () => ({
  // @ts-ignore
  ...jest.requireActual('@src/messageQueue'),
  sendMessage: () => mockSendMessage(),
  getQueueUrl: () => mockGetQueueUrl(),
}));

const mockStartExecution = jest.fn();
jest.mock('@src/stateMachine', () => ({
  // @ts-ignore
  ...jest.requireActual('@src/stateMachine'),
  startExecution: () => mockStartExecution(),
}));

const mockEvent = jest.fn();

describe('handler', () => {
  beforeEach(() => {
    mockEvent.mockReturnValue({
      Records: [
        {
          messageId: '11d6ee51-4cc7-4302-9e22-7cd8afdaadf5',
          receiptHandle: 'AQEBBX8nesZEXmkhsmZeyIE8iQAMig7qw...',
          body:
            '{ "sendAt": "2020-01-01", "channelId": "dashboard", "content": "content", "contentShort": "contentShort", "id":"111111111", "messageId":"message-123456789", "osuId":"111111111", "status":"NEW", "title":"title"}',
          attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: '1573251510774',
            SequenceNumber: '18849496460467696128',
            MessageGroupId: '1',
            SenderId: 'AIDAIO23YVJENQZJOL4VO',
            MessageDeduplicationId: '1',
            ApproximateFirstReceiveTimestamp: '1573251510774',
          },
          messageAttributes: {},
          md5OfBody: 'e4e68fb7bd0e697a0ae8f1bb342846b3',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:us-west-2:123456789012:userMessages',
          awsRegion: 'us-west-2',
        },
      ],
    });
    mockGetQueueUrl.mockResolvedValue({ QueueUrl: 'some-url' });
    mockSendMessage.mockResolvedValue(true);
    mockQuery.mockResolvedValue({ Items: [userMessage], Count: 1 });
    mockPutItem.mockResolvedValue(userMessage);
    mockUpdateItem.mockResolvedValue(userMessage);
  });

  it('publishes user messages to the queue', async () => {
    mockStartExecution.mockResolvedValue({ executionArn: 'some-arn', startDate: '2020-01-01' });
    await handler(mockEvent());
    expect(mockStartExecution).toHaveBeenCalled();
    expect(mockGetQueueUrl).not.toHaveBeenCalled();
    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(mockPutItem).not.toHaveBeenCalled();
    expect(mockUpdateItem).toHaveBeenCalled();
  });
  it('throws an error when there is a unhandled exception', async () => {
    mockStartExecution.mockRejectedValue('boom');
    await handler(mockEvent());
    expect(mockGetQueueUrl).toHaveBeenCalled();
    expect(mockSendMessage).toHaveBeenCalled();
    expect(mockPutItem).not.toHaveBeenCalled();
    expect(mockUpdateItem).toHaveBeenCalled();
  });
});
