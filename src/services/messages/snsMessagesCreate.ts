import { SQS_PROCESS_MESSAGE_QUEUE_NAME } from '@src/constants';
import { SNSEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { validate } from '@src/services/snsUtils';
import { getQueueUrl } from '@src/services/sqsUtils';
import { persistMessage, publishToQueue } from '@src/services/messages/utils';

export const handler = async (event: SNSEvent) => {
  const [valid, record] = validate(event);
  if (!valid || !record) {
    return;
  }

  try {
    const message = await persistMessage(record);
    if (message && message.sendAt <= new Date().toISOString().slice(0, 10)) {
      const queueUrl = await getQueueUrl(SQS_PROCESS_MESSAGE_QUEUE_NAME);
      await publishToQueue(message, queueUrl, message.id);
    }
  } catch (error) {
    console.error(error);
  }
};

export default handler;
