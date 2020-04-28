import { handler } from '@src/services/userMessages/httpUserMessagesList';
import { dynamoDbUserMessage, userMessage } from '@mocks/userMessage.mock';
import * as event from '../../../events/lambda.http.userMessagesList.json';

const mockEvent = jest.fn();
const mockQuery = jest.fn();
jest.mock('@src/database', () => ({
  ...jest.requireActual('@src/database'),
  query: () => mockQuery(),
}));

beforeEach(() => {
  mockEvent.mockReturnValue(event);
});

describe('handler', () => {
  it('fetches user messages for a specific user', async () => {
    mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessage], Count: 1 });
    mockEvent.mockReturnValue({
      ...event,
      pathParameters: {
        osuId: '111111111',
      },
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
  it('throws an error when there is a unhandled exception', async () => {
    mockQuery.mockRejectedValue('boom');
    try {
      await handler(mockEvent());
    } catch (err) {
      expect(err).toBe('boom');
    }
  });
});
