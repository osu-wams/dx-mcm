import { SQS_ERROR_MESSAGE_QUEUE_NAME, SQS_PROCESS_MESSAGE_QUEUE_NAME } from '@src/constants';
import { SNSEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { validate, parseMessage } from '@src/services/snsUtils';
import { getQueueUrl, publishToQueue } from '@src/services/sqsUtils';
import Message, { Status } from '@src/models/message';

export const persistMessage = async (message: Message): Promise<Message | undefined> => {
  const newMessage = await Message.upsert(message);
  console.log('Created -->  ', newMessage);
  return newMessage;
};

export const handler = async (event: SNSEvent) => {
  const [valid, record] = validate(event);
  if (!valid || !record) {
    return;
  }

  try {
    const message = parseMessage(record, Status.NEW);

    if (await Message.exists(message)) {
      const errorMessage = {
        error: `snsMessageCreate: duplicate Message found with hash value (${message.hash}).`,
        object: message,
      };
      const queueUrl = await getQueueUrl(SQS_ERROR_MESSAGE_QUEUE_NAME);
      await publishToQueue(errorMessage, queueUrl);
    } else {
      const persistedMessage = await persistMessage(message);
      if (persistedMessage && persistedMessage.sendAt <= new Date().toISOString().slice(0, 10)) {
        const queueUrl = await getQueueUrl(SQS_PROCESS_MESSAGE_QUEUE_NAME);
        await publishToQueue(persistedMessage, queueUrl, persistedMessage.id);
      }
    }
  } catch (error) {
    const errorMessage = {
      error: `snsMessageCreate: caught unhandled error: ${error.message}`,
      object: JSON.parse(record.Sns.Message),
    };
    const queueUrl = await getQueueUrl(SQS_ERROR_MESSAGE_QUEUE_NAME);
    await publishToQueue(errorMessage, queueUrl);

    /* istanbul ignore next */
    console.error(errorMessage);
  }
};

export default handler;
