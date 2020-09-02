import { APIGatewayProxyEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { responseBody } from '@src/services/httpUtils';
import UserMessage, { Status } from '@src/models/userMessage'; // eslint-disable-line no-unused-vars

export const handler = async (event: APIGatewayProxyEvent) => {
  const action = 'userMessage-read';
  try {
    const { userId, channelId, messageId } = event.pathParameters ?? {
      userId: undefined,
      channelId: undefined,
      messageId: undefined,
    };
    const params = JSON.stringify(event.pathParameters);
    if (!userId)
      throw new Error(`Missing userId ({onid}-{osuId}) in path. Path parameters: ${params}`);
    if (!channelId) throw new Error(`Missing channelId in path. Path parameters: ${params}`);
    if (!messageId) throw new Error(`Missing messageId in path. Path parameters: ${params}`);

    // @ts-ignore unused var osuId
    const [onid, osuId] = (userId ?? '').split('-'); // eslint-disable-line no-unused-vars

    // TODO: make find more intelligent to handle osuId and onid, or make two calls and have to deal with lastKey?!
    const userMessageResults = await UserMessage.find(onid, messageId, channelId);
    if (userMessageResults.count !== 1) {
      console.error(
        `Marking UserMessage read failed, found ${userMessageResults.count} records for userId:${userId}, messageId:${messageId}, channelId:${channelId}`,
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
