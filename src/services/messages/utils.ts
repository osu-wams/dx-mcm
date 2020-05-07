import UserMessage from '@src/models/userMessage'; // eslint-disable-line no-unused-vars
import Message from '@src/models/message';
import { AWSError } from 'aws-sdk';
import { sendMessage } from '@src/messageQueue';

export const persistMessage = async (message: Message): Promise<Message | undefined> => {
  const newMessage = await Message.upsert(message);
  console.log('Created -->  ', newMessage);
  return newMessage;
};

export const publishToQueue = async (
  message: Message | UserMessage | { error: string; message: Message | undefined },
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
