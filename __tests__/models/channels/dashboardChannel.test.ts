import { userMessage, dynamoDbUserMessage } from '@mocks/userMessage.mock';
import { getChannel } from '@src/models/userMessage';

const mockQuery = jest.fn();
const mockPutItem = jest.fn();
jest.mock('@src/database', () => ({
  // @ts-ignore
  ...jest.requireActual('@src/database'),
  query: () => mockQuery(),
  putItem: () => mockPutItem(),
}));

describe('dashboardChannel', () => {
  it('processes a UserMessage', async () => {
    mockQuery.mockResolvedValue({ Items: [dynamoDbUserMessage] });
    const channel = getChannel(userMessage);
    expect(await channel.process()).toBeUndefined();
    expect(mockPutItem).toBeCalled();
    expect(mockQuery).toBeCalled();
  });
});
