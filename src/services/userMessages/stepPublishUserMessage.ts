import UserMessage, { getChannel, Status } from '@src/models/userMessage';
import UserMessagePending from '@src/models/userMessagePending';
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
      const cause = `Disallowed publishing to channel (${userMessage.channelId}).`;
      console.error(cause, { sendToChannel, sendUserMessages });
      throw new Error(cause);
    }
  } catch (error) {
    /* istanbul ignore next */
    const cause = `Publishing UserMessage failed due to error: ${error.message}`;
    console.error(cause, error);

    const userMessagePending = new UserMessagePending({ userMessage: { ...userMessage } });
    userMessagePending.status = Status.ERROR;
    userMessagePending.statusMessage = error.errorMessage || error.message;

    await UserMessage.delete({
      id: userMessage.id,
      messageId: userMessage.messageId,
      channelId: userMessage.channelId,
    });
    await UserMessagePending.upsert(userMessagePending);
    callback(error);
  }
};

export default handler;
