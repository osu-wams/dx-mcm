import { SQSEvent, SQSRecord } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { AWSError, SQS } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import { getQueueUrl as messageQueueGetQueueUrl, sendMessage } from '@src/messageQueue';
import type Message from '@src/models/message'; // eslint-disable-line no-unused-vars
import type UserMessage from '@src/models/userMessage'; // eslint-disable-line no-unused-vars

/**
 * Validate and return the SQS records associated to this event.
 * @param event - An event from SQS
 * @returns Array[boolean, record] - If the validation was successful and the record it validated or undefined
 * @see <project_root>/events/lambda.sqs.*
 */
export const validate = (event: SQSEvent): [boolean, SQSRecord[] | undefined] => {
  if (event.Records.length === 0) {
    console.error(`Event has no records -->  `, event);
    return [false, undefined];
  }

  return [true, event.Records];
};

export const getQueueUrl = async (queueName: string): Promise<string> => {
  const response = await messageQueueGetQueueUrl(queueName).catch((err) => {
    throw new Error(`Failed fetching queueName: ${queueName}, caught: ${err}`);
  });
  if (response === AWSError) {
    throw new Error(`Handled AWSError when fetching queueUrl: ${response}`);
  }
  const queueResponse = response as SQS.GetQueueUrlResult;
  if (!queueResponse.QueueUrl) {
    throw new Error(`Failed fetching queueUrl: ${queueResponse}`);
  }
  return queueResponse.QueueUrl;
};

export const publishToQueue = async (
  message: Message | UserMessage | { error: string; object?: any },
  queueUrl: string,
  messageGroupId?: string,
) => {
  const publish: {
    QueueUrl: string;
    MessageBody: string;
    MessageGroupId?: string;
  } = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(message),
  };
  if (messageGroupId) publish.MessageGroupId = messageGroupId;

  const published = await sendMessage(publish);
  if (!published || published === AWSError) {
    console.error('Failed to publish -->  ', message, published);
  }
  console.log('Published -->  ', queueUrl, message, published);
};
