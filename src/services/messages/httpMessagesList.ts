import throat from 'throat';
import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import Message, { MessageStatus, Status } from '@src/models/message'; // eslint-disable-line no-unused-vars

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  console.log(event);
  try {
    const { date } = event.pathParameters ?? { date: new Date().toISOString().slice(0, 10) };
    const messageStatuses: MessageStatus[] = await Message.byStatusBeforeDate(Status.NEW, date);

    const messages: (Message | undefined)[] = await Promise.all(
      messageStatuses
        .filter((ms) => ms.id !== '')
        .map(throat(5, (messageStatus) => Message.find(messageStatus.sendAt, messageStatus.id))),
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        object: messages,
      }),
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
