import { APIGatewayProxyEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import UserMessage from '@src/models/userMessage'; // eslint-disable-line no-unused-vars

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const { osuId } = event.pathParameters ?? { osuId: undefined };
    if (!osuId) throw new Error('Missing osuId in path.');

    const userMessages: UserMessage[] | null = await UserMessage.findAll(osuId);
    if (!userMessages) throw new Error('No user messages found.');

    return {
      statusCode: 200,
      body: JSON.stringify(userMessages),
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
