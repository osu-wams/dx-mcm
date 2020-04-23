const dynamoDbUserMessage = {
  channelId: { S: 'dashboard' },
  channelMessageId: { S: 'dashboard:message-123456789' },
  channelSendAt: { S: 'dashboard:2020-01-01' },
  content: { S: 'content' },
  contentShort: { S: 'contentShort' },
  deliveredAt: { S: '2020-01-01' },
  messageId: { S: 'message-123456789' },
  osuId: { S: '123456789' },
  sendAt: { S: '2020-01-01' },
  status: { S: 'NEW' },
  statusSendAt: { S: 'NEW:2020-01-01' },
};
const emptyDynamoDbUserMessage = {
  channelId: { S: undefined },
  channelMessageId: { S: undefined },
  channelSendAt: { S: undefined },
  content: { S: undefined },
  contentShort: { S: undefined },
  messageId: { S: undefined },
  osuId: { S: undefined },
  sendAt: { S: undefined },
  status: { S: undefined },
  statusSendAt: { S: undefined },
};
const userMessage = {
  channelId: 'dashboard',
  channelMessageId: 'dashboard:message-123456789',
  channelSendAt: 'dashboard:2020-01-01',
  content: 'content',
  contentShort: 'contentShort',
  deliveredAt: '2020-01-01',
  messageId: 'message-123456789',
  osuId: '123456789',
  sendAt: '2020-01-01',
  status: 'NEW',
  statusSendAt: 'NEW:2020-01-01',
};
const emptyUserMessage = {
  channelId: '',
  channelMessageId: '',
  channelSendAt: '',
  content: '',
  contentShort: '',
  deliveredAt: '',
  messageId: '',
  osuId: '',
  sendAt: '',
  status: '',
  statusSendAt: '',
};

export { dynamoDbUserMessage, emptyDynamoDbUserMessage, emptyUserMessage, userMessage };
