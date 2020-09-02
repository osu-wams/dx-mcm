import throat from 'throat';
import { responseBody, successResponse, errorResponse } from '@src/services/httpUtils';
import { APIGatewayProxyEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import Message, { MessageStatus, Status } from '@src/models/message'; // eslint-disable-line no-unused-vars

export const handler = async (event: APIGatewayProxyEvent) => {
  const action = 'messages-list';
  try {
    const { date } = event.pathParameters ?? {
      date: `${new Date().toISOString().slice(0, 16)}:00.000Z`,
    };
    const messageStatuses: MessageStatus[] = await Message.byStatusBeforeDate(Status.NEW, date);

    const messages: (Message | undefined)[] = await Promise.all(
      messageStatuses
        .filter((ms) => ms.id !== '')
        .map(throat(5, (messageStatus) => Message.find(messageStatus.sendAt, messageStatus.id))),
    );

    return successResponse({
      body: responseBody({
        action,
        object: { messages },
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
