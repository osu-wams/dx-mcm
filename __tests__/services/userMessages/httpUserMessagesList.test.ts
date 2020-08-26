import { handler } from '@src/services/userMessages/httpUserMessagesList';
import { dynamoDbUserMessage, userMessage } from '@mocks/userMessage.mock';
import * as event from '../../../events/lambda.http.userMessagesList.json';
import * as channelEvent from '../../../events/lambda.http.userMessagesListByChannelId.json';
import * as statusEvent from '../../../events/lambda.http.userMessagesListByStatus.json';

const mockEvent = jest.fn();
const mockQuery = jest.fn();
jest.mock('@src/database', () => ({
  // @ts-ignore
  ...jest.requireActual('@src/database'),
  query: () => mockQuery(),
}));

beforeEach(() => {
  mockEvent.mockReturnValue(event);
});

describe('handler', () => {
  it('fetches user messages for a specific user', async () => {
    mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessage], Count: 1 });
    mockEvent.mockReturnValue({ ...event, pathParameters: { id: 'bobross-111111111' } });
    const result = await handler(mockEvent());
    expect({ ...result, body: JSON.parse(result.body) }).toMatchObject({
      body: {
        action: 'userMessages-list',
        object: { userMessageResults: { items: [userMessage], count: 1 } },
      },
      statusCode: 200,
    });
    expect(mockQuery).toHaveBeenCalled();
  });
  it('fetches user messages on a channel for a specific user', async () => {
    mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessage], Count: 1 });
    mockEvent.mockReturnValue({
      ...channelEvent,
      pathParameters: { id: 'bobross-111111111', channelId: 'dashboard' },
    });
    const result = await handler(mockEvent());
    expect({ ...result, body: JSON.parse(result.body) }).toMatchObject({
      body: {
        action: 'userMessages-list',
        object: { userMessageResults: { items: [userMessage], count: 1 } },
      },
      statusCode: 200,
    });
    expect(mockQuery).toHaveBeenCalled();
  });
  it('fetches user messages in a particular status', async () => {
    mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessage], Count: 1 });
    mockEvent.mockReturnValue({
      ...statusEvent,
      pathParameters: { status: 'error' },
    });
    const result = await handler(mockEvent());
    expect({ ...result, body: JSON.parse(result.body) }).toMatchObject({
      body: {
        action: 'userMessages-list',
        object: { userMessageResults: { items: [userMessage], count: 1 } },
      },
      statusCode: 200,
    });
    expect(mockQuery).toHaveBeenCalled();
  });
  it('should respond with an error when an invalid channel id is provided', async () => {
    mockEvent.mockReturnValue({
      ...channelEvent,
      pathParameters: { id: 'bobross-111111111', channelId: 'invalid-channel' },
    });
    const result = await handler(mockEvent());
    expect({ ...result, body: JSON.parse(result.body) }).toMatchObject({
      body: { action: 'userMessages-list', message: 'Missing valid channelId in path.' },
      statusCode: 500,
    });
  });
  it('should respond with an error when an invalid status is provided', async () => {
    mockEvent.mockReturnValue({
      ...statusEvent,
      pathParameters: { status: 'invalid-status' },
    });
    const result = await handler(mockEvent());
    expect({ ...result, body: JSON.parse(result.body) }).toMatchObject({
      body: { action: 'userMessages-list', message: 'Missing valid status in path.' },
      statusCode: 500,
    });
  });
  it('should respond with an error when no osuId is provided', async () => {
    mockEvent.mockReturnValue({ ...channelEvent, pathParameters: { osuId: undefined } });
    const result = await handler(mockEvent());
    expect({ ...result, body: JSON.parse(result.body) }).toMatchObject({
      body: { action: 'userMessages-list', message: 'Missing id ({onid}-{osuId}) in path.' },
      statusCode: 500,
    });
  });
  it('should respond with an error when no path parameters exist', async () => {
    mockEvent.mockReturnValue({ ...channelEvent, pathParameters: undefined });
    const result = await handler(mockEvent());
    expect({ ...result, body: JSON.parse(result.body) }).toMatchObject({
      body: { action: 'userMessages-list', message: 'Missing id ({onid}-{osuId}) in path.' },
      statusCode: 500,
    });
  });
  it('should respond with an error when there is a unhandled exception', async () => {
    mockQuery.mockRejectedValue('boom');
    const result = await handler(mockEvent());
    expect({ ...result, body: JSON.parse(result.body) }).toMatchObject({
      body: { action: 'userMessages-list' },
      statusCode: 500,
    });
  });
});
