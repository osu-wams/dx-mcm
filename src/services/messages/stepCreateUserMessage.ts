import throat from 'throat';
import { SQS_PROCESS_USER_MESSAGE_QUEUE_NAME } from '@src/constants';
import { getQueueUrl } from '@src/services/sqsUtils';
import { publishToQueue } from '@src/services/messages/utils';
import UserMessage from '@src/models/userMessage';
import type { MessageStateMachineResult, UserData } from './types'; // eslint-disable-line no-unused-vars

export const handler = async (event: MessageStateMachineResult, _context: any, callback: any) => {
  try {
    console.log('Handling event -->  ', event);

    const channels: string[] = event.processedQueries.find((v) => v.channels)?.channels ?? [];
    const users: UserData[] = event.processedQueries.find((v) => v.users)?.users ?? [];

    const userMessages: UserMessage[] = channels
      .map((c: string) =>
        users.map(
          (u: UserData) =>
            new UserMessage({
              userMessage: {
                channelId: c,
                content: event.content,
                contentShort: event.contentShort,
                messageId: event.id,
                osuId: u.id,
                smsNumber: u.phone ?? '',
                sendAt: event.sendAt,
                status: event.status,
              },
            }),
        ),
      )
      .flat();

    const persistedUserMessages = await Promise.all(
      userMessages.map(
        throat(50, (userMessage: UserMessage) => {
          return UserMessage.upsert(userMessage).then((um) => um.items[0]);
        }),
      ),
    );
    const filteredUserMessages = persistedUserMessages.filter(Boolean) as UserMessage[];

    const queueUrl = await getQueueUrl(SQS_PROCESS_USER_MESSAGE_QUEUE_NAME);
    await Promise.all(
      filteredUserMessages.map(
        throat(50, (userMessage: UserMessage) => {
          return publishToQueue(userMessage!, queueUrl);
        }),
      ),
    );
    callback(null, { userMessages });
  } catch (err) {
    console.error('Creating UserMessages failed -->  ', err);
    callback(err, null);
  }
};

export default handler;
