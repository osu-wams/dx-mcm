import throat from 'throat';
import { SQS_PROCESS_MESSAGE_QUEUE_NAME } from '@src/constants';
import { SNSEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { validate } from '@src/services/snsUtils';
import { getQueueUrl, publishToQueue } from '@src/services/sqsUtils';
import Message, { MessageStatus, Status } from '@src/models/message'; // eslint-disable-line no-unused-vars

export const handler = async (event: SNSEvent) => {
  const [valid, record] = validate(event);
  if (!valid || !record) {
    return;
  }
  const { sendAt } = JSON.parse(record.Sns.Message);
  try {
    const messageStatuses: MessageStatus[] = await Message.byStatusBeforeDate(Status.NEW, sendAt);

    const messages: (Message | undefined)[] = await Promise.all(
      messageStatuses
        .filter((ms) => ms.id !== '')
        .map(throat(5, (messageStatus) => Message.find(messageStatus.sendAt, messageStatus.id))),
    );

    const queueUrl = await getQueueUrl(SQS_PROCESS_MESSAGE_QUEUE_NAME);
    await Promise.all(
      messages
        .filter((m) => m !== undefined)
        .map(
          throat(50, (message) => {
            console.log('Processing -->  ', message);
            return publishToQueue(message!, queueUrl, message!.id);
          }),
        ),
    );
  } catch (error) {
    /* istanbul ignore next */
    console.error(error);
  }
};

export default handler;
