const dynamoDbUserMessage = {
  channelDeliveredAt: { S: 'dashboard#2020-01-01T16:20:00.000Z' },
  channelId: { S: 'dashboard' },
  channelMessageId: { S: 'dashboard#message-123456789' },
  channelSendAt: { S: 'dashboard#2020-01-01T16:20:00.000Z' },
  content: { S: 'content' },
  contentShort: { S: 'contentShort' },
  deliveredAt: { S: '2020-01-01T16:20:00.000Z' },
  id: { S: '123456789' },
  imageUrl: { S: 'https://blah.png' },
  messageId: { S: 'message-123456789' },
  onid: { S: 'bobross' },
  osuId: { S: '123456789' },
  sendAt: { S: '2020-01-01T16:20:00.000Z' },
  smsNumber: { S: '1111111111' },
  status: { S: 'NEW' },
  statusSendAt: { S: 'NEW#2020-01-01T16:20:00.000Z' },
  title: { S: 'title' },
};
const emptyDynamoDbUserMessage = {
  channelDeliveredAt: { S: undefined },
  channelId: { S: undefined },
  channelMessageId: { S: undefined },
  channelSendAt: { S: undefined },
  content: { S: undefined },
  contentShort: { S: undefined },
  id: { S: undefined },
  imageUrl: { S: undefined },
  messageId: { S: undefined },
  onid: { S: undefined },
  osuId: { S: undefined },
  sendAt: { S: undefined },
  smsNumber: { S: undefined },
  status: { S: undefined },
  statusSendAt: { S: undefined },
  title: { S: undefined },
};
const userMessage = {
  channelDeliveredAt: 'dashboard#2020-01-01T16:20:00.000Z',
  channelId: 'dashboard',
  channelMessageId: 'dashboard#message-123456789',
  channelSendAt: 'dashboard#2020-01-01T16:20:00.000Z',
  content: 'content',
  contentShort: 'contentShort',
  deliveredAt: '2020-01-01T16:20:00.000Z',
  id: '123456789',
  imageUrl: 'https://blah.png',
  messageId: 'message-123456789',
  onid: 'bobross',
  osuId: '123456789',
  sendAt: '2020-01-01T16:20:00.000Z',
  smsNumber: '1111111111',
  status: 'NEW',
  statusSendAt: 'NEW#2020-01-01T16:20:00.000Z',
  title: 'title',
};
const emptyUserMessage = {
  channelDeliveredAt: undefined,
  channelId: '',
  channelMessageId: '',
  channelSendAt: '',
  content: '',
  contentShort: '',
  deliveredAt: '',
  id: '',
  imageUrl: '',
  messageId: '',
  onid: '',
  osuId: '',
  sendAt: '',
  smsNumber: '',
  status: '',
  statusSendAt: '',
  title: '',
};

export { dynamoDbUserMessage, emptyDynamoDbUserMessage, emptyUserMessage, userMessage };
