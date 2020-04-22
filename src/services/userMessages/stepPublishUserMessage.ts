import UserMessage, { getChannel, Status } from '@src/models/userMessage';
import type { UserMessageStateMachineResult } from './types'; // eslint-disable-line no-unused-vars

export const handler = async (
  event: UserMessageStateMachineResult,
  context: any,
  callback: any,
) => {
  console.log('Handling event, context -->  ', event, context);

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
      const cause = `Publishing UserMessage disallowed --> sendToChannel? = ${sendToChannel}, Allowed to sendUserMessages = ${sendUserMessages.join(
        ', ',
      )}`;
      console.warn(cause);
      // TODO: New Status to cause this to retry in the future? Set the sendTo date in the future? Log the error and chill?
      await UserMessage.updateStatus(userMessage, Status.ERROR);
      callback(Error(cause));
    }
  } catch (error) {
    /* istanbul ignore next */
    const cause = `Publishing UserMessage failed due to error: ${error.mesage}`;
    console.error(cause, error);
    await UserMessage.updateStatus(userMessage, Status.ERROR);
    callback(error);
  }
};

export default handler;
