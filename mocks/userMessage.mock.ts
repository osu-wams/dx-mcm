const dynamoDbUserMessage = {
  channelId: { S: '123' },
  channelMessageId: { S: '123:message-123456789' },
  content: { S: 'content' },
  contentShort: { S: 'contentShort' },
  deliveredAt: { S: '2020-01-01' },
  messageId: { S: 'message-123456789' },
  osuId: { S: '123456789' },
  sendAt: { S: '2020-01-01' },
  status: { S: 'NEW' },
};
const emptyDynamoDbUserMessage = {
  channelId: { S: undefined },
  channelMessageId: { S: undefined },
  content: { S: undefined },
  contentShort: { S: undefined },
  deliveredAt: undefined,
  messageId: { S: undefined },
  osuId: { S: undefined },
  sendAt: { S: undefined },
  status: { S: undefined },
};
const userMessage = {
  channelId: '123',
  channelMessageId: '123:message-123456789',
  content: 'content',
  contentShort: 'contentShort',
  deliveredAt: '2020-01-01',
  messageId: 'message-123456789',
  osuId: '123456789',
  sendAt: '2020-01-01',
  status: 'NEW',
};
const userMessageStatus = {
  channelId: '123',
  channelMessageId: '123:message-123456789',
  deliveredAt: '2020-01-01',
  messageId: 'message-123456789',
  osuId: '123456789',
  sendAt: '2020-01-01',
  status: 'NEW',
};
const emptyUserMessage = {
  channelId: '',
  channelMessageId: '',
  content: '',
  contentShort: '',
  deliveredAt: '',
  messageId: '',
  osuId: '',
  sendAt: '',
  status: '',
};

export {
  dynamoDbUserMessage,
  emptyDynamoDbUserMessage,
  emptyUserMessage,
  userMessage,
  userMessageStatus,
};
