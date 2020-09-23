import { userMessage, dynamoDbUserMessage } from '@mocks/userMessage.mock';
import UserMessage, { getChannel } from '@src/models/userMessage';
import * as constants from '@src/constants';

const mockQuery = jest.fn();
const mockPutItem = jest.fn();
jest.mock('@src/database', () => ({
  // @ts-ignore
  ...jest.requireActual('@src/database'),
  query: () => mockQuery(),
  putItem: () => mockPutItem(),
}));

describe('dashboardChannel', () => {
  beforeEach(() => {
    /* eslint-disable */
    Object.defineProperty(constants, 'ENV', {
      value: 'development',
    });
    /* eslint-enable */
  });

  it('processes a UserMessage', async () => {
    mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessage] });
    const channel = getChannel(new UserMessage({ userMessage }));
    expect(await channel.process()).toBeUndefined();
    expect(mockPutItem).toBeCalled();
    expect(mockQuery).toBeCalled();
  });
});
