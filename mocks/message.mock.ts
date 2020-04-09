const dynamoDbMessage = {
  channelIds: { SS: ['123'] },
  content: { S: 'content' },
  contentShort: { S: 'contentShort' },
  id: { S: '123456789' },
  populationParams: { M: { affiliation: { S: 'test' } } },
  sendAt: { S: '2020-01-01' },
  status: { S: 'NEW' },
};
const emptyDynamoDbMessage = {
  channelIds: { SS: undefined },
  content: { S: undefined },
  contentShort: { S: undefined },
  id: { S: undefined },
  populationParams: { M: undefined },
  sendAt: { S: undefined },
  status: { S: undefined },
};
const message = {
  channelIds: ['123'],
  content: 'content',
  contentShort: 'contentShort',
  id: '123456789',
  populationParams: { affiliation: 'test' },
  sendAt: '2020-01-01',
  status: 'NEW',
};
const messageStatus = {
  id: '123456789',
  sendAt: '2020-01-01',
  status: 'NEW',
};
const emptyMessage = {
  channelIds: [],
  content: '',
  contentShort: '',
  id: '',
  populationParams: {},
  sendAt: '',
  status: '',
};

export { dynamoDbMessage, emptyDynamoDbMessage, emptyMessage, message, messageStatus };
