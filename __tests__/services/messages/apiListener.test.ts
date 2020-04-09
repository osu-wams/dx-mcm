import { handler } from '@src/services/messages/apiListener';
import { dynamoDbMessage, message } from '@mocks/message.mock';
import * as event from '../../../events/lambda.sns.create_message.json';

const mockCreateTable = jest.fn();
const mockQuery = jest.fn();
const mockPutItem = jest.fn();
jest.mock('@src/database', () => ({
  ...jest.requireActual('@src/database'),
  createTable: () => mockCreateTable(),
  query: () => mockQuery(),
  putItem: () => mockPutItem(),
}));

const consoleSpy = jest.spyOn(console, 'log');
const consoleErrorSpy = jest.spyOn(console, 'error');

describe('handler', () => {
  it('creates a new record', async () => {
    mockPutItem.mockResolvedValue(message);
    mockQuery.mockResolvedValue({ Items: [dynamoDbMessage] });
    const result = await handler(event);
    expect(consoleSpy).toHaveBeenCalled();
    expect(result).toEqual(undefined);
  });
  it('throws an error when there is a unhandled exception', async () => {
    mockPutItem.mockRejectedValue('boom');
    try {
      await handler(event);
    } catch (err) {
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(err).toBe('boom');
    }
  });
});
