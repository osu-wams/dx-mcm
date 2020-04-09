import Message from '@src/models/message';
import { SNSEvent, SNSEventRecord } from 'aws-lambda';
import { validate } from '@src/services/utils';

export const handler = async (event: SNSEvent) => {
  const [valid, record] = validate(event);
  if (!valid || !record) {
    return;
  }

  try {
    await persistMessage(record);
  } catch (error) {
    console.error(error);
  }
};

const persistMessage = async (record: SNSEventRecord) => {
  const {
    payload: { content, contentShort, channelIds, populationParams, sendAt },
  } = JSON.parse(record.Sns.Message);
  const message = await Message.upsert({
    id: record.Sns.MessageId,
    status: 'CREATED',
    sendAt,
    populationParams,
    channelIds,
    content,
    contentShort,
  });
  console.log('Created -->  ', message);
};
