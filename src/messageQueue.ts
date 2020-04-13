import { SQS, AWSError } from 'aws-sdk'; // eslint-disable-line no-unused-vars

const messageQueue = new SQS();

export const getQueueUrl = async (queueName: string): Promise<SQS.GetQueueUrlResult | AWSError> =>
  messageQueue.getQueueUrl({ QueueName: queueName }).promise();

export const sendMessage = async (params: {
  QueueUrl: string;
  MessageBody: string;
  MessageGroupId: string;
}): Promise<SQS.SendMessageResult | AWSError> => messageQueue.sendMessage(params).promise();
