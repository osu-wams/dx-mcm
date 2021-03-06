import { handler } from '@src/services/messages/httpMessagesPublisher';
import { message } from '@mocks/message.mock';
import * as createEvent from '../../../events/lambda.http.messagesPublisher.create.json';
import * as processEvent from '../../../events/lambda.http.messagesPublisher.process.json';

const mockEvent = jest.fn();
const mockGetQueueUrl = jest.fn();
const mockSendMessage = jest.fn();
jest.mock('@src/messageQueue', () => ({
  // @ts-ignore
  ...jest.requireActual('@src/messageQueue'),
  sendMessage: () => mockSendMessage(),
  getQueueUrl: () => mockGetQueueUrl(),
}));

const mockQuery = jest.fn();
const mockPutItem = jest.fn();
jest.mock('@src/database', () => ({
  // @ts-ignore
  ...jest.requireActual('@src/database'),
  createTable: () => jest.fn(),
  query: () => mockQuery(),
  putItem: () => mockPutItem(),
}));

beforeEach(() => {
  mockGetQueueUrl.mockResolvedValue({ QueueUrl: 'some-url' });
  mockSendMessage.mockResolvedValue(true);
  mockPutItem.mockResolvedValue(message);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('handler', () => {
  beforeEach(() => {
    mockEvent.mockReturnValue(createEvent);
    mockQuery
      .mockResolvedValueOnce({ Items: [], Count: 0 })
      .mockResolvedValueOnce({ Items: [message], Count: 1 });
  });

  it('fails to validate request', async () => {
    mockEvent.mockReturnValue({
      ...mockEvent(),
      body: null,
    });
    const result = await handler(mockEvent());
    expect(result).toMatchObject({ statusCode: 400 });
    expect(mockSendMessage).not.toHaveBeenCalled();
  });
  it('fails to publish a message to the queue', async () => {
    mockSendMessage.mockRejectedValue(false);
    const result = await handler(mockEvent());
    expect(result).toMatchObject({ statusCode: 500 });
  });
  it('throws an error when there is a unhandled exception', async () => {
    mockSendMessage.mockRejectedValue('boom');
    try {
      await handler(mockEvent());
    } catch (err) {
      expect(err).toBe('boom');
    }
  });
});

describe('create action', () => {
  beforeEach(() => {
    mockEvent.mockReturnValue(createEvent);
    mockQuery
      .mockResolvedValueOnce({ Items: [], Count: 0 })
      .mockResolvedValueOnce({ Items: [message], Count: 1 });
  });
  it('creates a new message', async () => {
    mockEvent.mockReturnValue({
      ...mockEvent(),
    });
    const result = await handler(mockEvent());
    expect(result).toMatchObject({ statusCode: 200 });
    expect(mockGetQueueUrl).toHaveBeenCalled();
    expect(mockSendMessage).toHaveBeenCalled();
  });
});

describe('process action', () => {
  beforeEach(() => {
    mockEvent.mockReturnValue(processEvent);
    mockQuery.mockResolvedValue({ Items: [message], Count: 1 });
  });
  it('processes existing messages', async () => {
    mockEvent.mockReturnValue({
      ...mockEvent(),
    });
    const result = await handler(mockEvent());
    expect(result).toMatchObject({ statusCode: 200 });
    expect(mockGetQueueUrl).toHaveBeenCalled();
    expect(mockSendMessage).toHaveBeenCalled();
  });
});
