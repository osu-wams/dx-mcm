import { SNS_TOPIC_ARN } from '@src/constants';
import { validateSnsAction, responseBody } from '@src/services/httpUtils';
import { publish } from '@src/messagePubSub';
import { APIGatewayProxyEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { AWSError, SNS } from 'aws-sdk'; // eslint-disable-line no-unused-vars

export const handler = async (event: APIGatewayProxyEvent) => {
  const { valid, response, payload, action } = validateSnsAction(event);
  if (!valid) return response;

  try {
    const message = {
      Message: JSON.stringify(payload),
      TopicArn: SNS_TOPIC_ARN,
      Subject: 'Messages',
      MessageAttributes: {
        action: {
          DataType: 'String',
          StringValue: action,
        },
      },
    };
    const published = await publish(message);
    if (published === AWSError) {
      throw new Error(`httpMessagesPublisher failed to publish message -->  ${message}`);
    }
    return {
      statusCode: 200,
      body: responseBody({
        message: 'Message created.',
        action,
        object: { messageId: (published as SNS.PublishResponse).MessageId },
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
