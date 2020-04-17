import { MESSAGE_STATE_MACHINE_ARN } from '@src/constants';
import { SQSEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { validate } from '@src/services/sqsUtils';
import { startExecution } from '@src/stateMachine';
import Message from '@src/models/message';

export const handler = async (event: SQSEvent) => {
  const [valid, records] = validate(event);
  if (!valid || !records) {
    return;
  }

  try {
    const record = records.shift()!;
    const message = new Message({ message: JSON.parse(record.body) });
    const response = await startExecution({
      stateMachineArn: MESSAGE_STATE_MACHINE_ARN,
      input: JSON.stringify(message),
      name: message.id,
    });
    console.log(response);
  } catch (error) {
    /* istanbul ignore next */
    console.error(error);
  }
};

export default handler;
