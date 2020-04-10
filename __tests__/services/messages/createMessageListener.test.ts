import { handler } from '@src/services/messages/createMessageListener';
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

describe('handler', () => {
  it('creates a new record', async () => {
    mockPutItem.mockResolvedValue(message);
    mockQuery.mockResolvedValue({ Items: [dynamoDbMessage] });
    const result = await handler(event);
    expect(result).toEqual(undefined);
  });
  it('throws an error when there is a unhandled exception', async () => {
    mockPutItem.mockRejectedValue('boom');
    try {
      await handler(event);
    } catch (err) {
      expect(err).toBe('boom');
    }
  });
});
