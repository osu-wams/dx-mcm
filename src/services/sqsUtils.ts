import { SQSEvent, SQSRecord } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { AWSError, SQS } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import { getQueueUrl as messageQueueGetQueueUrl } from '@src/messageQueue';

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
  const response = await messageQueueGetQueueUrl(queueName);
  if (response === AWSError) {
    throw new Error(`Handled AWSError when fetching queueUrl: ${response}`);
  }
  const queueResponse = response as SQS.GetQueueUrlResult;
  if (!queueResponse.QueueUrl) {
    throw new Error(`Failed fetching queueUrl: ${queueResponse}`);
  }
  return queueResponse.QueueUrl;
};
