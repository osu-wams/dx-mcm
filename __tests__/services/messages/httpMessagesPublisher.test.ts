import { handler } from '@src/services/messages/httpMessagesPublisher';
import * as event from '../../../events/lambda.http.messagesPublisher.json';

const mockEvent = jest.fn();
const mockPublish = jest.fn();
jest.mock('@src/messagePubSub', () => ({
  ...jest.requireActual('@src/messagePubSub'),
  publish: () => mockPublish(),
}));

beforeEach(() => {
  mockEvent.mockReturnValue(event);
});

describe('handler', () => {
  it('publishes an action to the queue', async () => {
    mockPublish.mockResolvedValue({ MessageId: 'test' });
    const result = await handler(mockEvent());
    expect({ ...result, body: JSON.parse(result.body) }).toMatchObject({
      body: {
        message: 'Action published.',
        action: '/api/v1/messages/action/create',
        object: { id: 'test', payload: JSON.parse(mockEvent().body).payload },
      },
      statusCode: 200,
    });
    expect(mockPublish).toHaveBeenCalled();
  });
  it('fails to validate request', async () => {
    mockEvent.mockReturnValue({
      ...mockEvent(),
      body: null,
    });
    const result = await handler(mockEvent());
    expect(result).toMatchObject({ statusCode: 400 });
    expect(mockPublish).not.toHaveBeenCalled();
  });
  it('fails to publish a message to the queue', async () => {
    const result = await handler(mockEvent());
    expect(result).toMatchObject({ statusCode: 500 });
    expect(mockPublish).toHaveBeenCalled();
  });
  it('throws an error when there is a unhandled exception', async () => {
    mockPublish.mockRejectedValue('boom');
    try {
      await handler(mockEvent());
    } catch (err) {
      expect(err).toBe('boom');
    }
  });
});
