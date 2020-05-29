import { handler } from '@src/services/messages/snsMessagesCreate';
import { dynamoDbMessage, message } from '@mocks/message.mock';

const mockEvent = jest.fn();
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
  beforeEach(() => {
    mockEvent.mockReturnValue({
      Records: [
        {
          EventVersion: '1.0',
          EventSubscriptionArn:
            'arn:aws:sns:us-west-2:123456789012:sns-lambda:21be56ed-a058-49f5-8c98-aedd2564c486',
          EventSource: 'aws:sns',
          Sns: {
            SignatureVersion: '1',
            Timestamp: '2019-01-02T12:45:07.000Z',
            Signature: 'tcc6faL2yUC6dgZdmrwh1Y4cGa/ebXEkAi6RibDsvpi+tE/1+82j...65r==',
            SigningCertUrl:
              'https://sns.us-west-2.amazonaws.com/SimpleNotificationService-ac565b8b1a6c5d002d285f9598aa1d9b.pem',
            MessageId: '95df01b4-ee98-5cb9-9903-4c221d41eb5e',
            Message:
              '{ "sendAt": "2020-01-01", "populationParams": {"affiliation": "undergrad" }, "channelIds": ["test"], "content": "long content", "contentShort": "short", "title": "title"}',
            MessageAttributes: {
              action: {
                Type: 'String',
                Value: '/api/v1/messages/action/create',
              },
            },
            Type: 'Notification',
            UnsubscribeUrl:
              'https://sns.us-west-2.amazonaws.com/?Action=Unsubscribe&amp;SubscriptionArn=arn:aws:sns:us-east-2:123456789012:test-lambda:21be56ed-a058-49f5-8c98-aedd2564c486',
            TopicArn: 'arn:aws:sns:us-west-2:123456789012:sns-lambda',
            Subject: 'Messages',
          },
        },
      ],
    });
    mockGetQueueUrl.mockResolvedValue({ QueueUrl: 'some-url' });
    mockSendMessage.mockResolvedValue(true);
  });
  it('creates a new record that is ready to be sent', async () => {
    mockPutItem.mockResolvedValue(message);
    mockQuery
      .mockResolvedValueOnce({ Items: [], Count: 0 })
      .mockResolvedValueOnce({ Items: [dynamoDbMessage], Count: 1 });
    await handler(mockEvent());
    expect(mockPutItem).toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockGetQueueUrl).toHaveBeenCalled();
    expect(mockSendMessage).toHaveBeenCalled();
  });
  it('creates a new record that is not yet ready to be sent', async () => {
    mockPutItem.mockResolvedValue({ ...message, sendAt: '2121-01-01' });
    mockQuery.mockResolvedValueOnce({ Items: [], Count: 0 }).mockResolvedValueOnce({
      Items: [{ ...dynamoDbMessage, sendAt: { S: '2121-01-01' } }],
      Count: 1,
    });
    await handler(mockEvent());
    expect(mockPutItem).toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockGetQueueUrl).not.toHaveBeenCalled();
    expect(mockSendMessage).not.toHaveBeenCalled();
  });
  it('publishes to the error queue when a duplicate message is posted', async () => {
    mockQuery.mockResolvedValueOnce({ Items: [dynamoDbMessage], Count: 1 });
    await handler(mockEvent());
    expect(mockPutItem).not.toHaveBeenCalled();
    expect(mockGetQueueUrl).toHaveBeenCalled();
    expect(mockSendMessage).toHaveBeenCalled();
  });
  it('publishes to the error queue when there is an error caught', async () => {
    mockQuery.mockRejectedValue('boom');
    await handler(mockEvent());
    expect(mockPutItem).not.toHaveBeenCalled();
    expect(mockGetQueueUrl).toHaveBeenCalled();
    expect(mockSendMessage).toHaveBeenCalled();
  });
  it('bails out of processing when there is no record', async () => {
    mockEvent.mockReturnValue({ Records: [] });
    await handler(mockEvent());
    expect(mockPutItem).not.toHaveBeenCalled();
    expect(mockGetQueueUrl).not.toHaveBeenCalled();
    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});
