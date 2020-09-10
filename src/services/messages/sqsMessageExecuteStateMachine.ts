import { MESSAGE_STATE_MACHINE_ARN, SQS_ERROR_MESSAGE_QUEUE_NAME } from '@src/constants';
import { SQSEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { startExecution } from '@src/stateMachine';
import Message, { Status } from '@src/models/message';
import { getQueueUrl, validate, publishToQueue } from '@src/services/sqsUtils';

export const handler = async (event: SQSEvent) => {
  const [valid, records] = validate(event);
  if (!valid || !records) {
    return;
  }

  const record = records.shift()!;
  const message = new Message({ message: JSON.parse(record.body) });

  try {
    // startExecution.name must be unique and can not be reused within 90 days, otherwise
    // the original response will be returned.
    await startExecution({
      stateMachineArn: MESSAGE_STATE_MACHINE_ARN,
      input: JSON.stringify(message),
      name: `${message.id}-${new Date().toISOString().slice(0, 10)}`,
    });
    await Message.updateStatus(
      message,
      Status.PROCESSING,
      'Message processing through state machine.',
    );
  } catch (err) {
    /* istanbul ignore next */
    console.error(err);
    const queueUrl = await getQueueUrl(SQS_ERROR_MESSAGE_QUEUE_NAME);
    publishToQueue({ error: err.message, object: event }, queueUrl);
    await Message.updateStatus(message, Status.ERROR, err.message);
  }
};

export default handler;
