import { SQS_PROCESS_USER_MESSAGE_QUEUE_NAME } from '@src/constants';
import { SQSEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { validate, getQueueUrl } from '@src/services/sqsUtils';
import { publishToQueue } from '@src/services/messages/utils';
import Message from '@src/models/message';

export const handler = async (event: SQSEvent) => {
  const [valid, records] = validate(event);
  if (!valid || !records) {
    return;
  }

  try {
    const record = records.shift()!;
    const message = new Message({ message: JSON.parse(record.body) });
    const queueUrl = await getQueueUrl(SQS_PROCESS_USER_MESSAGE_QUEUE_NAME);
    await publishToQueue(message, queueUrl);
    /*
    if (message && message.sendAt <= new Date().toISOString().slice(0, 10)) {
      const queueUrl = await getQueueUrl(SQS_PROCESS_USER_MESSAGE_QUEUE_NAME);
      await publishToQueue(message, queueUrl);
    }
    */
  } catch (error) {
    /* istanbul ignore next */
    console.error(error);
  }
};

export default handler;
