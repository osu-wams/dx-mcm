import { handler } from '@src/services/messages/stateMachine/stepGetUserPopulation';
import * as invokeEvent from '../../../../events/lambda.step.stepGetUserPopulation.json';

const mockEvent = jest.fn();
const mockPutObject = jest.fn();
jest.mock('@src/services/s3Utils', () => ({
  // @ts-ignore
  ...jest.requireActual('@src/services/s3Utils'),
  putObject: () => mockPutObject(),
}));

const mockGetMembers = jest.fn();
jest.mock('@osu-wams/grouper', () => ({
  // @ts-ignore
  ...jest.requireActual('@osu-wams/grouper'),
  getMembers: () => mockGetMembers(),
}));

describe('handler', () => {
  beforeEach(() => {
    mockEvent.mockReturnValue(invokeEvent);
    mockPutObject.mockReturnValue(true);
    mockGetMembers.mockReturnValue([{ subjects: [{ sourceId: 'ldap', id: 'bobross' }] }]);
  });

  it('does not process missing affiliation stems', async () => {
    await handler(mockEvent(), undefined);
    expect(mockGetMembers).toBeCalled();
  });
});
