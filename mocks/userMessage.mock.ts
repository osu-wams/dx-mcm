const dynamoDbUserMessage = {
  channelId: { S: '123' },
  content: { S: 'content' },
  contentShort: { S: 'contentShort' },
  messageId: { S: 'message-123456789' },
  osuId: { S: '123456789' },
  sendAt: { S: '2020-01-01' },
  status: { S: 'NEW' },
};
const emptyDynamoDbUserMessage = {
  channelId: { S: undefined },
  content: { S: undefined },
  contentShort: { S: undefined },
  messageId: { S: undefined },
  osuId: { S: undefined },
  sendAt: { S: undefined },
  status: { S: undefined },
};
const userMessage = {
  channelId: '123',
  content: 'content',
  contentShort: 'contentShort',
  messageId: 'message-123456789',
  osuId: '123456789',
  sendAt: '2020-01-01',
  status: 'NEW',
};
const userMessageStatus = {
  channelId: '123',
  messageId: 'message-123456789',
  osuId: '123456789',
  sendAt: '2020-01-01',
  status: 'NEW',
};
const emptyUserMessage = {
  channelId: '',
  content: '',
  contentShort: '',
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
