import { SQSEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { validate } from '@src/services/sqsUtils';
import UserMessage, { getChannel, Status } from '@src/models/userMessage';

export const handler = async (event: SQSEvent) => {
  const [valid, records] = validate(event);
  if (!valid || !records) {
    return;
  }

  const record = records.shift()!;
  const userMessage = new UserMessage({ userMessage: JSON.parse(record.body) });

  try {
    const channel = getChannel(userMessage);
    await channel.process();
    console.log('Processed UserMessage -->  ', userMessage);
  } catch (error) {
    /* istanbul ignore next */
    console.error(error);
    await UserMessage.updateStatus(userMessage, Status.ERROR);
  }
};

export default handler;
