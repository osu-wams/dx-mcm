import { APIGatewayProxyEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import UserMessage, { UserMessageResults, ChannelId } from '@src/models/userMessage'; // eslint-disable-line no-unused-vars

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const { osuId, lastKey, channelId } = event.pathParameters ?? {
      osuId: undefined,
      lastKey: undefined,
      channelId: undefined,
    };
    if (!osuId) throw new Error('Missing osuId in path.');
    let userMessageResults: UserMessageResults;
    if (channelId) {
      const selectedChannel = ChannelId[channelId.toUpperCase() as keyof typeof ChannelId];
      if (!selectedChannel) throw new Error('Missing valid channelId in path.');

      userMessageResults = await UserMessage.byChannel(osuId, selectedChannel, lastKey);
    } else {
      userMessageResults = await UserMessage.findAll(osuId, lastKey);
    }

    if (!userMessageResults.count) throw new Error('No user messages found.');

    return {
      statusCode: 200,
      body: JSON.stringify(userMessageResults),
    };
  } catch (error) {
    console.dir(error, { depth: null, showHidden: true });
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
  }
};

export default handler;
