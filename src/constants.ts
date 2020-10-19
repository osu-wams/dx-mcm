require('./config');

const DATA_TRANSFER_BUCKET = process.env.DATA_TRANSFER_BUCKET?.toString() ?? '';
const DX_ALERTS_SLACK_HOOK = process.env.DX_ALERTS_SLACK_HOOK || '';
const DYNAMODB_API_VERSION = '2012-08-10';
const DYNAMODB_TABLE_PREFIX = `${process.env.SERVICE_NAME}`;
const DYNAMODB_REGION = process.env.DYNAMODB_REGION || 'us-west-2';
const ENV = `${process.env.ENV}`;
const MESSAGE_STATE_MACHINE_ARN = `${process.env.MESSAGE_STATE_MACHINE_ARN}`;
const S3_API_VERSION = '2006-03-01';
const REDIS_HOST = process.env.IS_LOCAL
  ? 'localhost'
  : process.env.REDIS_HOST?.toString() ?? 'localhost';
const REDIS_PORT = process.env.IS_LOCAL
  ? 6379
  : parseInt(process.env.REDIS_PORT?.toString() ?? '6379', 10);
const S3_REGION = process.env.S3_REGION || 'us-west-2';
const SQS_ERROR_MESSAGE_QUEUE_NAME = `${process.env.SQS_ERROR_MESSAGE_QUEUE_NAME}`;
const SQS_ERROR_USER_MESSAGE_QUEUE_NAME = `${process.env.SQS_ERROR_USER_MESSAGE_QUEUE_NAME}`;
const SQS_PROCESS_MESSAGE_QUEUE_NAME = `${process.env.SQS_PROCESS_MESSAGE_QUEUE_NAME}`;
const SQS_PROCESS_USER_MESSAGE_QUEUE_NAME = `${process.env.SQS_PROCESS_USER_MESSAGE_QUEUE_NAME}`;
const USER_MESSAGE_STATE_MACHINE_ARN = `${process.env.USER_MESSAGE_STATE_MACHINE_ARN}`;

const BASE_URL = (() => {
  let prefix = '';
  if (ENV === 'development') prefix = 'dev.';
  if (ENV === 'stage') prefix = 'stage.';
  return `https://${prefix}mcm.oregonstate.edu`;
})();

const USER_MESSAGE_API_PATH = '/api/v1/userMessages';
const USER_MESSAGE_API_URL = `${BASE_URL}${USER_MESSAGE_API_PATH}`;

export {
  BASE_URL,
  DATA_TRANSFER_BUCKET,
  DX_ALERTS_SLACK_HOOK,
  DYNAMODB_API_VERSION,
  DYNAMODB_TABLE_PREFIX,
  DYNAMODB_REGION,
  ENV,
  MESSAGE_STATE_MACHINE_ARN,
  REDIS_HOST,
  REDIS_PORT,
  S3_API_VERSION,
  S3_REGION,
  SQS_ERROR_MESSAGE_QUEUE_NAME,
  SQS_ERROR_USER_MESSAGE_QUEUE_NAME,
  SQS_PROCESS_MESSAGE_QUEUE_NAME,
  SQS_PROCESS_USER_MESSAGE_QUEUE_NAME,
  USER_MESSAGE_STATE_MACHINE_ARN,
  USER_MESSAGE_API_PATH,
  USER_MESSAGE_API_URL,
};
