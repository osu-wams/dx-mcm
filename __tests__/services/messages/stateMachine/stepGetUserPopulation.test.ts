import { handler } from '@src/services/messages/stateMachine/stepGetUserPopulation';
import * as invokeEvent from '../../../../events/lambda.step.stepGetUserPopulation.json';

const mockEvent = jest.fn();

describe('handler', () => {
  beforeEach(() => {
    mockEvent.mockReturnValue(invokeEvent);
  });

  it('does not process missing affiliation stems', async () => {
    const result = await handler(mockEvent(), undefined, jest.fn());
    expect(result).toMatchObject({ statusCode: 400 });
  });
});
