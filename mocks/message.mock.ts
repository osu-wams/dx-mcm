const dynamoDbMessage = {
  channelIds: { SS: ['123'] },
  content: { S: 'content' },
  contentShort: { S: 'contentShort' },
  hash: {
    S:
      'eyJzZW5kQXQiOiIyMDIwLTAxLTAxIiwic3RhdHVzIjoiTkVXIiwicG9wdWxhdGlvblBhcmFtcyI6eyJhZmZpbGlhdGlvbiI6InRlc3QiLCJvc3VJZHMiOlsiOTg3NjU0MzIxIl19LCJjaGFubmVsSWRzIjpbIjEyMyJdLCJjb250ZW50IjoiY29udGVudCIsImNvbnRlbnRTaG9ydCI6ImNvbnRlbnRTaG9ydCJ9',
  },
  id: { S: '123456789' },
  imageUrl: { S: 'https://blah.png' },
  populationParams: {
    M: {
      affiliations: { SS: ['test'] },
      users: { SS: [JSON.stringify({ id: 'bobross', phone: '+15412345678' })] },
      // users: { SS: ['987654321'] },
    },
  },
  sendAt: { S: '2020-01-01T16:20:00.000Z' },
  status: { S: 'NEW' },
  statusMessage: { NULL: true },
  title: { S: 'title' },
};
const emptyDynamoDbMessage = {
  channelIds: { SS: undefined },
  content: { S: undefined },
  contentShort: { S: undefined },
  hash: { S: undefined },
  id: { S: undefined },
  imageUrl: { S: undefined },
  populationParams: { M: undefined },
  sendAt: { S: undefined },
  status: { S: undefined },
  statusMessage: { S: undefined },
  title: { S: undefined },
};
const message = {
  channelIds: ['123'],
  content: 'content',
  contentShort: 'contentShort',
  hash:
    'eyJzZW5kQXQiOiIyMDIwLTAxLTAxIiwic3RhdHVzIjoiTkVXIiwicG9wdWxhdGlvblBhcmFtcyI6eyJhZmZpbGlhdGlvbiI6InRlc3QiLCJvc3VJZHMiOlsiOTg3NjU0MzIxIl19LCJjaGFubmVsSWRzIjpbIjEyMyJdLCJjb250ZW50IjoiY29udGVudCIsImNvbnRlbnRTaG9ydCI6ImNvbnRlbnRTaG9ydCJ9',
  id: '123456789',
  imageUrl: 'https://blah.png',
  populationParams: { affiliations: ['test'], users: [{ id: 'bobross', phone: '+15412345678' }] },
  sendAt: '2020-01-01T16:20:00.000Z',
  status: 'NEW',
  statusMessage: '',
  title: 'title',
};
const messageStatus = {
  id: '123456789',
  sendAt: '2020-01-01T16:20:00.000Z',
  status: 'NEW',
};
const emptyMessage = {
  channelIds: [],
  content: '',
  contentShort: '',
  hash: '',
  id: '',
  imageUrl: '',
  populationParams: {},
  sendAt: '',
  status: '',
  statusMessage: '',
  title: '',
};

export { dynamoDbMessage, emptyDynamoDbMessage, emptyMessage, message, messageStatus };
