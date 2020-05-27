const dynamoDbMessage = {
  channelIds: { SS: ['123'] },
  content: { S: 'content' },
  contentShort: { S: 'contentShort' },
  hash: {
    S:
      'eyJzZW5kQXQiOiIyMDIwLTAxLTAxIiwic3RhdHVzIjoiTkVXIiwicG9wdWxhdGlvblBhcmFtcyI6eyJhZmZpbGlhdGlvbiI6InRlc3QiLCJvc3VJZHMiOlsiOTg3NjU0MzIxIl19LCJjaGFubmVsSWRzIjpbIjEyMyJdLCJjb250ZW50IjoiY29udGVudCIsImNvbnRlbnRTaG9ydCI6ImNvbnRlbnRTaG9ydCJ9',
  },
  id: { S: '123456789' },
  // populationParams: { M: { affiliation: { S: 'test' }, osuIds: { SS: ['987654321'] } } },
  populationParams: {
    M: {
      affiliation: { S: 'test' },
      users: { SS: [JSON.stringify({ id: '987654321', phone: '+15412345678' })] },
      // users: { SS: ['987654321'] },
    },
  },
  sendAt: { S: '2020-01-01' },
  status: { S: 'NEW' },
  title: { S: 'title' },
};
const emptyDynamoDbMessage = {
  channelIds: { SS: undefined },
  content: { S: undefined },
  contentShort: { S: undefined },
  hash: { S: undefined },
  id: { S: undefined },
  populationParams: { M: undefined },
  sendAt: { S: undefined },
  status: { S: undefined },
  title: { S: undefined },
};
const message = {
  channelIds: ['123'],
  content: 'content',
  contentShort: 'contentShort',
  hash:
    'eyJzZW5kQXQiOiIyMDIwLTAxLTAxIiwic3RhdHVzIjoiTkVXIiwicG9wdWxhdGlvblBhcmFtcyI6eyJhZmZpbGlhdGlvbiI6InRlc3QiLCJvc3VJZHMiOlsiOTg3NjU0MzIxIl19LCJjaGFubmVsSWRzIjpbIjEyMyJdLCJjb250ZW50IjoiY29udGVudCIsImNvbnRlbnRTaG9ydCI6ImNvbnRlbnRTaG9ydCJ9',
  id: '123456789',
  populationParams: { affiliation: 'test', users: [{ id: '987654321', phone: '+15412345678' }] },
  // populationParams: { affiliation: 'test', osuIds: ['987654321'] },
  sendAt: '2020-01-01',
  status: 'NEW',
  title: 'title',
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
  hash: '',
  id: '',
  populationParams: {},
  sendAt: '',
  status: '',
  title: '',
};

export { dynamoDbMessage, emptyDynamoDbMessage, emptyMessage, message, messageStatus };
