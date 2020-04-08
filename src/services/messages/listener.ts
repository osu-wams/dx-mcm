import { SNSHandler } from 'aws-lambda';
import Message from '@src/models/message';

export const handler: SNSHandler = async (event, _context, _callback) => {
  try {
    for (const record of event.Records) {
      const { content, contentShort, channelIds, populationParams } = JSON.parse(
        record.Sns.Message,
      );
      console.log(JSON.parse(record.Sns.Message));
      const message = await Message.upsert({
        sendAt: new Date().toISOString().slice(0, 10),
        id: new Date().toISOString().slice(-6),
        status: 'NEW',
        populationParams,
        channelIds,
        content,
        contentShort,
      });
      console.log('Created -->  ', message);
    }
  } catch (error) {
    console.log(error);
  }
};
