import { APIGatewayProxyEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { responseBody, successResponse, errorResponse } from '@src/services/httpUtils';
import UserMessage, { UserMessageResults, ChannelId, Status } from '@src/models/userMessage'; // eslint-disable-line no-unused-vars

export const handler = async (event: APIGatewayProxyEvent) => {
  const action = 'userMessages-list';
  try {
    const { userId, lastKey, channelId, status } = event.pathParameters ?? {
      userId: undefined,
      lastKey: undefined,
      channelId: undefined,
      status: undefined,
    };
    if (!userId && !status)
      throw new Error(
        `Missing userId ({onid}-{osuId}) in path. Path parameters: ${JSON.stringify(
          event.pathParameters,
        )}`,
      );

    // @ts-ignore unused var osuId
    const [onid, osuId] = (userId ?? '').split('-'); // eslint-disable-line no-unused-vars

    let userMessageResults: UserMessageResults;
    if (channelId) {
      // TODO: make byChannel more intelligent to handle osuId and onid, or make two calls and have to deal with lastKey?!
      const selectedChannel = ChannelId[channelId.toUpperCase() as keyof typeof ChannelId];
      if (!selectedChannel) throw new Error('Missing valid channelId in path.');
      userMessageResults = await UserMessage.byChannel(onid, selectedChannel, lastKey);
    } else if (status) {
      const selectedStatus = Status[status.toUpperCase() as keyof typeof Status];
      if (!selectedStatus) throw new Error('Missing valid status in path.');
      userMessageResults = await UserMessage.allByStatus(selectedStatus, lastKey);
    } else {
      // TODO: make findAll more intelligent to handle osuId and onid, or make two calls and have to deal with lastKey?!
      userMessageResults = await UserMessage.findAll(onid, lastKey);
      return successResponse({
        cacheSeconds: 0,
        body: responseBody({
          action,
          object: { userMessageResults },
        }),
      });
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
