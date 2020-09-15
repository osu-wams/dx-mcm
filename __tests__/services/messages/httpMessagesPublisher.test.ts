import { handler } from '@src/services/messages/httpMessagesPublisher';
import * as event from '../../../events/lambda.http.messagesPublisher.json';

const mockEvent = jest.fn();
const mockPublishToQueue = jest.fn();
jest.mock('@src/messageQueue', () => ({
  // @ts-ignore
  ...jest.requireActual('@src/messageQueue'),
  publishToQueue: () => mockPublishToQueue(),
}));

beforeEach(() => {
  mockEvent.mockReturnValue(event);
});

describe('handler', () => {
  it('fails to validate request', async () => {
    mockEvent.mockReturnValue({
      ...mockEvent(),
      body: null,
    });
    const result = await handler(mockEvent());
    expect(result).toMatchObject({ statusCode: 400 });
    expect(mockPublishToQueue).not.toHaveBeenCalled();
  });
  it('fails to publish a message to the queue', async () => {
    const result = await handler(mockEvent());
    expect(result).toMatchObject({ statusCode: 500 });
  });
  it('throws an error when there is a unhandled exception', async () => {
    mockPublishToQueue.mockRejectedValue('boom');
    try {
      await handler(mockEvent());
    } catch (err) {
      expect(err).toBe('boom');
    }
  });
});
