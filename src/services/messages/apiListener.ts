import { SQS_QUEUE_NAME } from '@src/constants';
import Message, { Status } from '@src/models/message';
import { SNSEvent, SNSEventRecord } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { validate } from '@src/services/utils';
import { SQS } from 'aws-sdk';

const persistMessage = async (record: SNSEventRecord): Promise<Message | undefined> => {
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

const publishToQueue = async (message: Message) => {
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
      })
      .promise();
    console.log('Published -->  ', published);
  }
};

export const handler = async (event: SNSEvent) => {
  const [valid, record] = validate(event);
  if (!valid || !record) {
    return;
  }

  try {
    const message = await persistMessage(record);
    if (message && message.sendAt <= new Date().toISOString().slice(0, 10)) {
      await publishToQueue(message);
    }
  } catch (error) {
    console.error(error);
  }
};

export default handler;
