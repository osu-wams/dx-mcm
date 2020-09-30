import { SQS_ERROR_MESSAGE_QUEUE_NAME } from '@src/constants';
import { getQueueUrl, publishToQueue, publishUserMessagesToQueue } from '@src/services/sqsUtils';
import UserMessage from '@src/models/userMessage';
import Message, { Status } from '@src/models/message';
import { getObject } from '@src/services/s3Utils';
import { MessageStateMachineResult, MessageWithPopulation, UserData } from '../types'; // eslint-disable-line no-unused-vars

/**
 * Initialize unique UserMessage instances targetting the combination of channels and users provided.
 * @param event the message with processedQueries array attached from previous steps
 * @param channels the channels found in previous steps
 * @param users the users found in previous steps
 */
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

export const handler = async (event: MessageStateMachineResult, _context: any, callback: any) => {
  const message = { ...event };
  try {
    // message.processedQueries[].channels as a result from stepGetChannels
    const channels: string[] = message.processedQueries.find((v) => v.channels)?.channels ?? [];
    // message.processedQueries[].users as a result from stepGetUserPopulation
    const { key, bucket } = message.processedQueries.find((v) => v.s3Data)?.s3Data ?? {};

    if (!key && !bucket)
      throw new Error(
        `Unable to fetch data processed by stepGetUserPopulation from S3, no bucket and key provided. Be sure a successful return from stepGetUserPopulation includes { s3Data: { bucket:, key: } }`,
      );
    const processedMessage: MessageWithPopulation = await getObject<MessageWithPopulation>(
      key!,
      bucket!,
    );
    const userMessages: UserMessage[] = buildUserMessages(
      message,
      channels,
      processedMessage.targetPopulation,
    );
    await publishUserMessagesToQueue(userMessages);
    await Message.updateStatus(
      message,
      Status.SENT,
      `Published at ${new Date().toISOString()} to be sent at ${message.sendAt}`,
    );
    callback(null, {
      userMessagePublishedCount: userMessages.length,
      messageId: message.id,
    });
  } catch (err) {
    console.error('stepCreateUserMessage handler failed -->  ', err);
    const queueUrl = await getQueueUrl(SQS_ERROR_MESSAGE_QUEUE_NAME);
    publishToQueue({ error: err.message, object: { message } }, queueUrl);
    await Message.updateStatus(message, Status.ERROR, err.message);
    callback(err.message, null);
  }
};

export default handler;
