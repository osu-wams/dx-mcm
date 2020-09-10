import throat from 'throat';
import { SQS_PROCESS_USER_MESSAGE_QUEUE_NAME, SQS_ERROR_MESSAGE_QUEUE_NAME } from '@src/constants';
import { getQueueUrl, publishToQueue } from '@src/services/sqsUtils';
import UserMessage from '@src/models/userMessage';
import Message, { Status } from '@src/models/message';
import { MessageStateMachineResult, UserData } from '../types'; // eslint-disable-line no-unused-vars

const buildUserMessages = (
  event: MessageStateMachineResult,
  channels: string[],
  users: UserData[],
): UserMessage[] => {
  try {
    return channels
      .map((c: string) =>
        users.map(
          (u: UserData) =>
            new UserMessage({
              userMessage: {
                channelId: c,
                content: event.content,
                contentShort: event.contentShort,
                messageId: event.id!,
                id: u.id,
                imageUrl: event.imageUrl,
                osuId: u.osuId ?? '',
                onid: u.onid ?? '',
                smsNumber: u.phone ?? '',
                sendAt: event.sendAt,
                status: event.status,
                title: event.title,
              },
            }),
        ),
      )
      .flat();
  } catch (err) {
    console.error(err);
    throw new Error(
      'Failed to translate target channels and users into individual UserMessages for persistence.',
    );
  }
};

const persistUserMessages = (userMessages: UserMessage[]): Promise<UserMessage[]> => {
  try {
    return Promise.all(
      userMessages.map(
        throat(50, (userMessage: UserMessage) => {
          return UserMessage.upsert(userMessage).then((um) => um.items[0]);
        }),
      ),
    );
  } catch (err) {
    console.error(err);
    throw new Error('Failed persisting individual UserMessages to DynamoDB.');
  }
};

const publishUserMessagesToQueue = async (userMessages: UserMessage[]): Promise<void[]> => {
  try {
    const queueUrl = await getQueueUrl(SQS_PROCESS_USER_MESSAGE_QUEUE_NAME);
    return Promise.all(
      userMessages.map(
        throat(50, (userMessage: UserMessage) => {
          return publishToQueue(userMessage!, queueUrl);
        }),
      ),
    );
  } catch (err) {
    console.error(err);
    throw new Error('Failed publishing individual UserMessages to queue for delivery.');
  }
};

export const handler = async (event: MessageStateMachineResult, _context: any, callback: any) => {
  const message = { ...event };
  try {
    // message.processedQueries[].channels as a result from stepGetChannels
    const channels: string[] = message.processedQueries.find((v) => v.channels)?.channels ?? [];
    // message.processedQueries[].users as a result from stepGetUserPopulation
    const users: UserData[] = message.processedQueries.find((v) => v.users)?.users ?? [];
    const userMessages: UserMessage[] = buildUserMessages(message, channels, users);
    const persistedUserMessages = await persistUserMessages(userMessages);
    const filteredUserMessages = persistedUserMessages.filter(Boolean) as UserMessage[];
    await publishUserMessagesToQueue(filteredUserMessages);
    await Message.updateStatus(
      message,
      Status.SENT,
      `Published at ${new Date().toISOString()} to be sent at ${message.sendAt}`,
    );
    callback(null, { userMessages });
  } catch (err) {
    console.error('Creating UserMessages failed -->  ', err);
    const queueUrl = await getQueueUrl(SQS_ERROR_MESSAGE_QUEUE_NAME);
    publishToQueue({ error: err.message, object: event }, queueUrl);
    await Message.updateStatus(message, Status.ERROR, err.message);
    callback(err.message, null);
  }
};

export default handler;
