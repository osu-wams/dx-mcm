import UserMessage, { getChannel, Status } from '@src/models/userMessage';
import type { UserMessageStateMachineResult } from './types'; // eslint-disable-line no-unused-vars

export const handler = async (
  event: UserMessageStateMachineResult,
  _context: any,
  callback: any,
) => {
  console.log('Handling event -->  ', event);

  const userMessage = new UserMessage({ userMessage: event });

  try {
    const sendToChannel: boolean =
      event.processedQueries.find((v) => v.sendToChannel)?.sendToChannel ?? false;
    const sendUserMessages: string[] =
      event.processedQueries.find((v) => v.sendUserMessages)?.sendUserMessages ?? [];
    if (sendToChannel && sendUserMessages.some((um) => userMessage.channelMessageId === um)) {
      const channel = getChannel(userMessage);
      await channel.process();
      console.log('Processed UserMessage -->  ', userMessage);
      callback(null, { userMessage });
    } else {
      console.warn(
        `Publishing UserMessage disallowed --> sendToChannel? = ${sendToChannel}, Allowed to sendUserMessages = ${sendUserMessages.join(
          ', ',
        )}  `,
      );
      // TODO: New Status to cause this to retry in the future? Set the sendTo date in the future? Log the error and chill?
      await UserMessage.updateStatus(userMessage, Status.ERROR);
      callback({}, null);
    }
  } catch (error) {
    /* istanbul ignore next */
    console.error('Publishing UserMessage failed -->  ', error);
    await UserMessage.updateStatus(userMessage, Status.ERROR);
    callback(error, null);
  }
};

export default handler;
