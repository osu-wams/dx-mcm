import throat from 'throat';
import { v4 as uuidv4 } from 'uuid';
import { SQS_ERROR_MESSAGE_QUEUE_NAME, SQS_PROCESS_MESSAGE_QUEUE_NAME } from '@src/constants';
import {
  validateAction,
  responseBody,
  errorResponse,
  successResponse,
} from '@src/services/httpUtils';
import Message, { MessageCreateParams, MessageStatus, Status } from '@src/models/message'; // eslint-disable-line no-unused-vars
import { APIGatewayProxyEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { getQueueUrl, publishToQueue } from '@src/services/sqsUtils';

const persistMessage = async (message: Message): Promise<Message | undefined> => {
  const newMessage = await Message.upsert(message);
  console.log('Created -->  ', newMessage);
  return newMessage;
};

const createMessage = async (message: Message): Promise<Message | undefined> => {
  if (await Message.exists(message)) {
    const errorMessage = {
      error: `Duplicate Message found with hash value (${message.hash}).`,
      object: message,
    };
    const queueUrl = await getQueueUrl(SQS_ERROR_MESSAGE_QUEUE_NAME);
    await publishToQueue(errorMessage, queueUrl);
    throw new Error(errorMessage.error);
  } else {
    const persistedMessage = await persistMessage(message);
    if (persistedMessage && persistedMessage.sendAt <= new Date().toISOString()) {
      const queueUrl = await getQueueUrl(SQS_PROCESS_MESSAGE_QUEUE_NAME);
      await publishToQueue(persistedMessage, queueUrl, persistedMessage.id);
    }
    if (!persistMessage) throw new Error('Message was not persisted.');
    return persistedMessage;
  }
};

const processMessages = async (sendAt?: string): Promise<(Message | undefined)[]> => {
  const messageStatuses: MessageStatus[] = await Message.byStatusBeforeDate(
    Status.NEW,
    sendAt ?? `${new Date().toISOString().slice(0, 16)}:00.000Z`,
  );

  const messages: (Message | undefined)[] = await Promise.all(
    messageStatuses
      .filter((ms) => ms.id !== '')
      .map(throat(5, (messageStatus) => Message.find(messageStatus.sendAt, messageStatus.id))),
  );

  const queueUrl = await getQueueUrl(SQS_PROCESS_MESSAGE_QUEUE_NAME);
  await Promise.all(
    messages
      .filter((m) => m !== undefined)
      .map(
        throat(50, (message) => {
          console.log('Processing -->  ', message);
          return publishToQueue(message!, queueUrl, message!.id);
        }),
      ),
  );
  return messages;
};

/**
 * A generic handler to publish the supplied payload to the SNS topic with a
 * particular action. This provides a general way of getting data to lambdas
 * subscribed to the topic and specific actions.
 * @param event the api gateway proxy event
 * @see events/lambda.httpMessagesPublisher.json
 * @see ./serverless-functions.yml : snsMessagesCreate.events.sns.filterPolicy.action to see subscription
 * @see ./serverless-functions.yml : httpMessagesPublisher to see API endpoint
 */
export const handler = async (event: APIGatewayProxyEvent) => {
  const { valid, response, payload, action } = validateAction(event);
  if (!valid) return response;

  let apiGatewayResponse;
  try {
    if (action.toLowerCase().endsWith('create')) {
      const message = new Message({ message: payload as MessageCreateParams });
      message.id = uuidv4();
      message.status = Status.NEW;
      const persistedMessage = await createMessage(message);
      apiGatewayResponse = successResponse({
        successCode: 200,
        body: responseBody({
          message: 'Message created.',
          action,
          object: { ...persistedMessage },
        }),
      });
    } else if (action.toLowerCase().endsWith('process')) {
      const messages = await processMessages(payload.sendAt);
      apiGatewayResponse = successResponse({
        successCode: 200,
        body: responseBody({
          message: 'Message(s) set to process.',
          action,
          object: { messages },
        }),
      });
    } else {
      throw new Error('Action not found.');
    }
    return apiGatewayResponse;
  } catch (error) {
    console.dir(error, { depth: null, showHidden: true });
    return errorResponse({
      body: responseBody({ error, action }),
    });
  }
};

export default handler;
