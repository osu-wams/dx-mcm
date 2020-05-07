import { APIGatewayProxyEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { responseBody, successResponse, errorResponse } from '@src/services/httpUtils';
import UserMessage, { UserMessageResults, ChannelId } from '@src/models/userMessage'; // eslint-disable-line no-unused-vars

export const handler = async (event: APIGatewayProxyEvent) => {
  const action = 'userMessages-list';
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

    return successResponse({
      body: responseBody({
        action,
        object: { userMessageResults },
      }),
    });
  } catch (error) {
    console.dir(error, { depth: null, showHidden: true });
    return errorResponse({
      body: responseBody({ error, action }),
    });
  }
};

export default handler;
