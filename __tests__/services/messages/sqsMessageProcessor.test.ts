import { handler } from '@src/services/messages/sqsMessageProcessor';
import * as event from '../../../events/lambda.sqs.messageProcessor.json';

const mockStartExecution = jest.fn();
jest.mock('@src/stateMachine', () => ({
  ...jest.requireActual('@src/stateMachine'),
  startExecution: () => mockStartExecution(),
}));

describe('handler', () => {
  it('publishes pending messages to the queue', async () => {
    mockStartExecution.mockResolvedValue({ executionArn: 'some-arn', startDate: '2020-01-01' });
    const result = await handler(event);
    expect(result).toEqual(undefined);
    expect(mockStartExecution).toHaveBeenCalled();
  });
  it('throws an error when there is a unhandled exception', async () => {
    mockStartExecution.mockRejectedValue('boom');
    try {
      await handler(event);
    } catch (err) {
      expect(err).toBe('boom');
    }
  });
});
