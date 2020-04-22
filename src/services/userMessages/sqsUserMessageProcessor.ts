import { USER_MESSAGE_STATE_MACHINE_ARN } from '@src/constants';
import { SQSEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { validate } from '@src/services/sqsUtils';
import { startExecution } from '@src/stateMachine';
import UserMessage, { compositeKey } from '@src/models/userMessage';

export const handler = async (event: SQSEvent) => {
  const [valid, records] = validate(event);
  if (!valid || !records) {
    return;
  }

  try {
    const record = records.shift()!;
    const userMessage = new UserMessage({ userMessage: JSON.parse(record.body) });
    const response = await startExecution({
      stateMachineArn: USER_MESSAGE_STATE_MACHINE_ARN,
      input: JSON.stringify(userMessage),
      name: compositeKey([userMessage.channelId, userMessage.messageId], '_'),
    });
    console.log(response);
  } catch (error) {
    /* istanbul ignore next */
    console.error(error);
  }
};

export default handler;
