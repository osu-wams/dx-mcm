const dynamoDbUserMessage = {
  channelDeliveredAt: { S: 'dashboard#2020-01-01T16:20:00.000Z' },
  channelId: { S: 'dashboard' },
  channelMessageId: { S: 'dashboard#message-123456789' },
  content: { S: 'content' },
  contentShort: { S: 'contentShort' },
  deliveredAt: { S: '2020-01-01T16:20:00.000Z' },
  id: { S: 'bobross' },
  imageUrl: { S: 'https://blah.png' },
  messageId: { S: 'message-123456789' },
  onid: { S: 'bobross' },
  osuId: { S: '123456789' },
  sendAt: { S: '2020-01-01T16:20:00.000Z' },
  smsNumber: { S: '1111111111' },
  status: { S: 'NEW' },
  title: { S: 'title' },
  updatedAt: { S: '2020-01-01T16:20:00.000Z' },
};
const dynamoDbUserMessagePending = {
  ...dynamoDbUserMessage,
  status: { S: 'ERROR' },
  statusMessage: { S: 'Error message' },
  messageChannelUser: { S: 'message-123456789#dashboard#bobross' },
  updatedAtMessageId: { S: '2020-01-01T16:20:00.000Z#message-123456789' },
};
const emptyDynamoDbUserMessage = {
  channelDeliveredAt: { S: undefined },
  channelId: { S: undefined },
  channelMessageId: { S: undefined },
  content: { S: undefined },
  contentShort: { S: undefined },
  deliveredAt: { S: undefined },
  id: { S: undefined },
  imageUrl: { S: undefined },
  messageId: { S: undefined },
  onid: { S: undefined },
  osuId: { S: undefined },
  sendAt: { S: undefined },
  smsNumber: { S: undefined },
  status: { S: undefined },
  title: { S: undefined },
  updatedAt: { S: undefined },
};
const emptyDynamoDbUserMessagePending = {
  ...emptyDynamoDbUserMessage,
  statusMessage: { S: undefined },
  messageChannelUser: { S: undefined },
  updatedAtMessageId: { S: undefined },
};

const userMessage = {
  channelDeliveredAt: 'dashboard#2020-01-01T16:20:00.000Z',
  channelId: 'dashboard',
  channelMessageId: 'dashboard#message-123456789',
  content: 'content',
  contentShort: 'contentShort',
  deliveredAt: '2020-01-01T16:20:00.000Z',
  id: 'bobross',
  imageUrl: 'https://blah.png',
  messageChannelUser: '',
  messageId: 'message-123456789',
  onid: 'bobross',
  osuId: '123456789',
  sendAt: '2020-01-01T16:20:00.000Z',
  smsNumber: '1111111111',
  status: 'NEW',
  title: 'title',
  updatedAt: '2020-01-01T16:20:00.000Z',
  updatedAtMessageId: '',
};

const userMessagePending = {
  ...userMessage,
  status: 'ERROR',
  statusMessage: 'Error message',
  messageChannelUser: 'message-123456789#dashboard#bobross',
  updatedAtMessageId: '2020-01-01T16:20:00.000Z#message-123456789',
};

const emptyUserMessage = {
  channelDeliveredAt: '',
  channelId: '',
  channelMessageId: '',
  content: '',
  contentShort: '',
  deliveredAt: '',
  id: '',
  imageUrl: '',
  messageChannelUser: '',
  messageId: '',
  onid: '',
  osuId: '',
  sendAt: '',
  smsNumber: '',
  status: '',
  title: '',
  updatedAt: '',
  updatedAtMessageId: '',
};

const emptyUserMessagePending = {
  ...emptyUserMessage,
  statusMessage: '',
  messageChannelUser: '',
  updatedAtMessageId: '',
};

export {
  dynamoDbUserMessage,
  dynamoDbUserMessagePending,
  emptyDynamoDbUserMessage,
  emptyDynamoDbUserMessagePending,
  emptyUserMessage,
  emptyUserMessagePending,
  userMessage,
  userMessagePending,
};
