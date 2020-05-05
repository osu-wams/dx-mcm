import UserMessage from '@src/models/userMessage'; // eslint-disable-line no-unused-vars
import Message, { Status } from '@src/models/message';
import { SNSEventRecord } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { AWSError } from 'aws-sdk';
import { sendMessage } from '@src/messageQueue';

export const persistMessage = async (record: SNSEventRecord): Promise<Message | undefined> => {
  const { content, contentShort, channelIds, populationParams, sendAt } = JSON.parse(
    record.Sns.Message,
  );
  const message = new Message({
    message: {
      id: record.Sns.MessageId,
      status: Status.NEW,
      sendAt,
      populationParams,
      channelIds,
      content,
      contentShort,
    },
  });
  const newMessage = await Message.upsert(message);
  console.log('Created -->  ', newMessage);
  return newMessage;
};

export const publishToQueue = async (
  message: Message | UserMessage,
  queueUrl: string,
  messageGroupId?: string,
) => {
  const publish: {
    QueueUrl: string;
    MessageBody: string;
    MessageGroupId?: string;
  } = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(message),
  };
  if (messageGroupId) publish.MessageGroupId = messageGroupId;

  const published = await sendMessage(publish);
  if (!published || published === AWSError) {
    console.error('Failed to publish -->  ', message, published);
  }
  console.log('Published -->  ', queueUrl, message, published);
};
