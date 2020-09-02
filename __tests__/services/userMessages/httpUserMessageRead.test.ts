import { handler } from '@src/services/userMessages/httpUserMessageRead';
import { dynamoDbUserMessage, userMessage } from '@mocks/userMessage.mock';
import * as event from '../../../events/lambda.http.userMessageRead.json';

const mockEvent = jest.fn();
const mockQuery = jest.fn();
jest.mock('@src/database', () => ({
  // @ts-ignore
  ...jest.requireActual('@src/database'),
  query: () => mockQuery(),
  updateItem: () => jest.fn(),
}));

beforeEach(() => {
  mockEvent.mockReturnValue(event);
});

describe('handler', () => {
  it('updates userMessage to mark as read', async () => {
    mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessage], Count: 1 });
    const result = await handler(mockEvent());
    expect({ ...result, body: JSON.parse(result.body) }).toMatchObject({
      body: {
        action: 'userMessage-read',
        object: { userMessage },
      },
      statusCode: 200,
    });
    expect(mockQuery).toHaveBeenCalled();
  });
  it('fails when an incorrect number of userMessages were found', async () => {
    mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessage, dynamoDbUserMessage], Count: 2 });
    const result = await handler(mockEvent());
    expect({ ...result, body: JSON.parse(result.body) }).toMatchObject({
      body: {
        action: 'userMessage-read',
        message: 'Mark message as read failed.',
      },
      statusCode: 409,
    });
    expect(mockQuery).toHaveBeenCalled();
  });
  it('should respond with an error when no userId is provided', async () => {
    mockEvent.mockReturnValue({
      ...event,
      pathParameters: { ...event.pathParameters, userId: undefined },
    });
    const result = await handler(mockEvent());
    expect({ ...result, body: JSON.parse(result.body) }).toMatchObject({
      body: {
        action: 'userMessage-read',
        message:
          'Missing userId ({onid}-{osuId}) in path. Path parameters: {"channelId":"channelId","messageId":"messageId"}',
      },
      statusCode: 500,
    });
  });
  it('should respond with an error when no channelId is provided', async () => {
    mockEvent.mockReturnValue({
      ...event,
      pathParameters: { ...event.pathParameters, channelId: undefined },
    });
    const result = await handler(mockEvent());
    expect({ ...result, body: JSON.parse(result.body) }).toMatchObject({
      body: {
        action: 'userMessage-read',
        message:
          'Missing channelId in path. Path parameters: {"userId":"bobross-111111111","messageId":"messageId"}',
      },
      statusCode: 500,
    });
  });
  it('should respond with an error when no messageId is provided', async () => {
    mockEvent.mockReturnValue({
      ...event,
      pathParameters: { ...event.pathParameters, messageId: undefined },
    });
    const result = await handler(mockEvent());
    expect({ ...result, body: JSON.parse(result.body) }).toMatchObject({
      body: {
        action: 'userMessage-read',
        message:
          'Missing messageId in path. Path parameters: {"userId":"bobross-111111111","channelId":"channelId"}',
      },
      statusCode: 500,
    });
  });
  it('should respond with an error when no path parameters exist', async () => {
    mockEvent.mockReturnValue({ ...event, pathParameters: undefined });
    const result = await handler(mockEvent());
    expect({ ...result, body: JSON.parse(result.body) }).toMatchObject({
      body: {
        action: 'userMessage-read',
        message: 'Missing userId ({onid}-{osuId}) in path. Path parameters: undefined',
      },
      statusCode: 500,
    });
  });
  it('should respond with an error when there is a unhandled exception', async () => {
    mockQuery.mockRejectedValue('boom');
    const result = await handler(mockEvent());
    expect({ ...result, body: JSON.parse(result.body) }).toMatchObject({
      body: { action: 'userMessage-read' },
      statusCode: 500,
    });
  });
});
