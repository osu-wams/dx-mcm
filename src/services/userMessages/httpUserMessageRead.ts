import { APIGatewayProxyEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { responseBody } from '@src/services/httpUtils';
import UserMessage, { Status } from '@src/models/userMessage'; // eslint-disable-line no-unused-vars

export const handler = async (event: APIGatewayProxyEvent) => {
  const action = 'userMessage-read';
  try {
    const { osuId, channelId, messageId } = event.pathParameters ?? {
      osuId: undefined,
      channelId: undefined,
      messageId: undefined,
    };
    if (!osuId) throw new Error('Missing osuId in path.');
    if (!channelId) throw new Error('Missing channelId in path.');
    if (!messageId) throw new Error('Missing messageId in path.');

    const userMessageResults = await UserMessage.find(osuId, messageId, channelId);
    if (userMessageResults.count !== 1) {
      console.error(
        `Marking UserMessage read failed, found ${userMessageResults.count} records for osuId:${osuId}, messageId:${messageId}, channelId:${channelId}`,
      );
      return {
        statusCode: 409,
        body: responseBody({
          action,
          message: 'Mark message as read failed.',
        }),
      };
    }

    const userMessageStatusResults = await UserMessage.updateStatus(
      userMessageResults.items[0],
      Status.READ,
    );

    return {
      statusCode: 200,
      body: responseBody({
        action,
        object: { userMessage: userMessageStatusResults.items[0] },
      }),
    };
  } catch (error) {
    console.dir(error, { depth: null, showHidden: true });
    return {
      statusCode: 500,
      body: responseBody({ error, action }),
    };
  }
};

export default handler;
