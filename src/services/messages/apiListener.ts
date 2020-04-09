import Message, { Status } from '@src/models/message';
import { SNSEvent, SNSEventRecord } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { validate } from '@src/services/utils';

const persistMessage = async (record: SNSEventRecord) => {
  const {
    payload: { content, contentShort, channelIds, populationParams, sendAt },
  } = JSON.parse(record.Sns.Message);
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
};

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

export default handler;