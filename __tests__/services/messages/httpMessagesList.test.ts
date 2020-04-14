import { handler } from '@src/services/messages/httpMessagesList';
import { dynamoDbMessage, message } from '@mocks/message.mock';
import * as event from '../../../events/lambda.http.messagesList.json';

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
  it('fetches messages that are currently ready to send', async () => {
    mockQuery.mockResolvedValue({ Items: [dynamoDbMessage] });
    const result = await handler(mockEvent());
    expect(result).toMatchObject({
      body: JSON.stringify({ object: [message] }),
      statusCode: 200,
    });
    expect(mockQuery).toHaveBeenCalled();
  });
  it('fetches messages that are ready to send as of a set date', async () => {
    mockEvent.mockReturnValue({
      ...event,
      pathParameters: {
        sendAt: '2020-05-01',
      },
    });
    mockQuery.mockResolvedValue({ Items: [dynamoDbMessage] });
    const result = await handler(mockEvent());
    expect(result).toMatchObject({
      body: JSON.stringify({ object: [message] }),
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
