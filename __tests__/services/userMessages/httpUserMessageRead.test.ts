import { handler } from '@src/services/userMessages/httpUserMessageRead';
import { dynamoDbUserMessage, userMessage } from '@mocks/userMessage.mock';
import * as event from '../../../events/lambda.http.userMessageRead.json';

const mockEvent = jest.fn();
const mockQuery = jest.fn();
const mockUpdateItem = jest.fn();
jest.mock('@src/database', () => ({
  ...jest.requireActual('@src/database'),
  query: () => mockQuery(),
  updateItem: () => mockUpdateItem(),
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
        object: { userMessage },
      },
      statusCode: 200,
    });
    expect(mockQuery).toHaveBeenCalled();
  });
  it('should respond with an error when no osuId is provided', async () => {
    mockEvent.mockReturnValue({
      ...event,
      pathParameters: { ...event.pathParameters, osuId: undefined },
    });
    const result = await handler(mockEvent());
    expect({ ...result, body: JSON.parse(result.body) }).toMatchObject({
      body: { action: 'userMessage-read', message: 'Missing osuId in path.' },
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
      body: { action: 'userMessage-read', message: 'Missing channelId in path.' },
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
      body: { action: 'userMessage-read', message: 'Missing messageId in path.' },
      statusCode: 500,
    });
  });
  it('should respond with an error when no path parameters exist', async () => {
    mockEvent.mockReturnValue({ ...event, pathParameters: undefined });
    const result = await handler(mockEvent());
    expect({ ...result, body: JSON.parse(result.body) }).toMatchObject({
      body: { action: 'userMessage-read', message: 'Missing osuId in path.' },
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
