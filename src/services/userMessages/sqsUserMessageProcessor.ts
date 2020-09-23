import { USER_MESSAGE_STATE_MACHINE_ARN, SQS_ERROR_USER_MESSAGE_QUEUE_NAME } from '@src/constants';
import { SQSEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { validate, getQueueUrl, publishToQueue } from '@src/services/sqsUtils';
import { startExecution } from '@src/stateMachine';
import UserMessage, { compositeKey, Status } from '@src/models/userMessage';
import UserMessagePending from '@src/models/userMessagePending';

export const handler = async (event: SQSEvent) => {
  const [valid, records] = validate(event);
  if (!valid || !records) {
    return;
  }

  const record = records.shift()!;
  const userMessage = new UserMessage({ userMessage: JSON.parse(record.body) });

  try {
    await startExecution({
      stateMachineArn: USER_MESSAGE_STATE_MACHINE_ARN,
      input: JSON.stringify(userMessage),
      name: compositeKey([userMessage.channelId, userMessage.messageId], '_'),
    });
  } catch (err) {
    /* istanbul ignore next */
    console.error(err);
    const queueUrl = await getQueueUrl(SQS_ERROR_USER_MESSAGE_QUEUE_NAME);
    publishToQueue({ error: err.message, object: event }, queueUrl);
    const userMessagePending = new UserMessagePending({ userMessage: { ...userMessage } });
    userMessagePending.status = Status.ERROR;
    userMessagePending.statusMessage = err.errorMessage || err.message;

    await UserMessage.delete({
      id: userMessage.id,
      messageId: userMessage.messageId,
      channelId: userMessage.channelId,
    });
    await UserMessagePending.upsert(userMessagePending);
  }
};

export default handler;
