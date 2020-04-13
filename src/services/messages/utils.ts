import Message, { Status } from '@src/models/message';
import { SNSEventRecord } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { AWSError } from 'aws-sdk';
import { sendMessage } from '@src/messageQueue';

export const persistMessage = async (record: SNSEventRecord): Promise<Message | undefined> => {
  const { content, contentShort, channelIds, populationParams, sendAt } = JSON.parse(
    record.Sns.Message,
  );
  const message = await Message.upsert({
    id: record.Sns.MessageId,
    status: Status.NEW,
    sendAt,
    populationParams,
    channelIds,
    content,
    contentShort,
  });
  console.log('Created -->  ', message);
  return message;
};

export const publishToQueue = async (message: Message, queueUrl: string) => {
  const published = await sendMessage({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(message),
    MessageGroupId: message.id,
  });
  if (!published || published === AWSError) {
    console.error('Failed to publish -->  ', message, published);
  }
  console.log('Published -->  ', published);
};
