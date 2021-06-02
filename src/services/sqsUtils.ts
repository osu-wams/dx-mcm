import { SQSEvent, SQSRecord } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { SQS } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import { getQueueUrl as messageQueueGetQueueUrl, sendMessage } from '@src/messageQueue';
import type Message from '@src/models/message'; // eslint-disable-line no-unused-vars
import type UserMessage from '@src/models/userMessage'; // eslint-disable-line no-unused-vars
import {
  SQS_ERROR_USER_MESSAGE_QUEUE_NAME,
  SQS_PROCESS_USER_MESSAGE_QUEUE_NAME,
} from '@src/constants';
import throat from 'throat';

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

  console.log('Published -->  ', queueUrl, message, published);
};

/**
 * Publish each UserMessages instance to the processing queue where a lambda will
 * fire off processing each individual UserMessage and deliver it to its intended channel. If
 * publishing to the processing queue fails, then publish to the error queue for disposition.
 * @param userMessages the UserMessage instances that were persisted to DynamoDB
 */
export const publishUserMessagesToQueue = async (userMessages: UserMessage[]): Promise<void[]> => {
  try {
    const queueUrl = await getQueueUrl(SQS_PROCESS_USER_MESSAGE_QUEUE_NAME);
    const errorQueueUrl = await getQueueUrl(SQS_ERROR_USER_MESSAGE_QUEUE_NAME);
    return Promise.all(
      userMessages.map(
        throat(50, (userMessage: UserMessage) => {
          return publishToQueue(userMessage!, queueUrl).catch((err) => {
            // TODO: Mark the UserMessage as a fail status?
            publishToQueue({ object: { userMessage }, error: err }, errorQueueUrl);
            console.error(err);
          });
        }),
      ),
    );
  } catch (err) {
    // Throw error caught when one of the getQueueUrl fails, setting Message in error state
    console.error(err);
    throw new Error(
      `${userMessages.length} UserMessages persisted/upserted in DynamoDB, but publishing to SQS failed. Caught: ${err}`,
    );
  }
};
