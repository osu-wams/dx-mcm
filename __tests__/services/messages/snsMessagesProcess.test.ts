import { handler } from '@src/services/messages/snsMessagesProcess';
import { dynamoDbMessage } from '@mocks/message.mock';
import * as event from '../../../events/lambda.sns.messagesProcess.json';

const mockQuery = jest.fn();
jest.mock('@src/database', () => ({
  // @ts-ignore
  ...jest.requireActual('@src/database'),
  createTable: () => jest.fn(),
  query: () => mockQuery(),
  putItem: () => jest.fn(),
}));

const mockGetQueueUrl = jest.fn();
const mockSendMessage = jest.fn();
jest.mock('@src/messageQueue', () => ({
  // @ts-ignore
  ...jest.requireActual('@src/messageQueue'),
  sendMessage: () => mockSendMessage(),
  getQueueUrl: () => mockGetQueueUrl(),
}));

const mockEvent = jest.fn();

describe('handler', () => {
  beforeEach(() => {
    mockEvent.mockReturnValue(event);
  });

  it('publishes pending messages to the queue', async () => {
    mockQuery.mockResolvedValue({ Items: [dynamoDbMessage] });
    mockGetQueueUrl.mockResolvedValue({ QueueUrl: 'some-url' });
    const result = await handler(mockEvent());
    expect(result).toEqual(undefined);
    expect(mockGetQueueUrl).toHaveBeenCalled();
    expect(mockSendMessage).toHaveBeenCalled();
  });
  it('publishes pending messages to the queue defaulting to today if sendAt is not supplied', async () => {
    mockEvent.mockReturnValue({
      ...event,
      Records: [
        {
          ...event.Records[0],
          Sns: {
            Message: '{}',
          },
        },
      ],
    });
    mockQuery.mockResolvedValue({ Items: [dynamoDbMessage] });
    mockGetQueueUrl.mockResolvedValue({ QueueUrl: 'some-url' });
    const result = await handler(mockEvent());
    expect(result).toEqual(undefined);
    expect(mockGetQueueUrl).toHaveBeenCalled();
    expect(mockSendMessage).toHaveBeenCalled();
  });
  it('throws an error when there is a unhandled exception', async () => {
    mockQuery.mockRejectedValue('boom');
    await handler(mockEvent());
    expect(mockGetQueueUrl).not.toHaveBeenCalled();
    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});
