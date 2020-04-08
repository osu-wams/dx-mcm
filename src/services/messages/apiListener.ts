import Message from '@src/models/message';

// TODO: find appropriate type for event
export const handler = async (event: any) => {
  try {
    const record = event.Records.pop();
    const {
      payload: { content, contentShort, channelIds, populationParams },
    } = JSON.parse(record.Sns.Message);
    const message = await Message.upsert({
      sendAt: new Date().toISOString().slice(0, 10),
      id: record.Sns.MessageId,
      status: 'NEW',
      populationParams,
      channelIds,
      content,
      contentShort,
    });
    console.log('Created -->  ', message);
  } catch (error) {
    console.error(error);
  }
};
