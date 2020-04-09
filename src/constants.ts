require('./config');

const DYNAMODB_API_VERSION = '2012-08-10';
const DYNAMODB_TABLE_PREFIX = `${process.env.ENV}-dx-mcm-`;
const SQS_QUEUE_NAME = `${process.env.SQS_QUEUE_NAME}`;

export { DYNAMODB_API_VERSION, DYNAMODB_TABLE_PREFIX, SQS_QUEUE_NAME };
