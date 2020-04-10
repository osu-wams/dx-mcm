import { SQS_QUEUE_NAME } from '@src/constants';
import Message, { Status } from '@src/models/message';
import { SNSEventRecord } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { SQS } from 'aws-sdk';

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

export const publishToQueue = async (message: Message) => {
  // TODO: move SQS calls to <projectRoot>/src/queue.ts for isolation and mocking
  const sqs = new SQS();
  const response = await sqs.getQueueUrl({ QueueName: SQS_QUEUE_NAME }).promise();
  const queueUrl = response.QueueUrl;
  if (!queueUrl) {
    // throw an error?
    console.error(`Failed to get the SQS Queue Url for queue name: ${SQS_QUEUE_NAME}`);
  } else {
    const published = await sqs
      .sendMessage({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message),
        MessageGroupId: message.id,
      })
      .promise();
    console.log('Published -->  ', published);
  }
};
