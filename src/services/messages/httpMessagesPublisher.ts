import { SNS } from 'aws-sdk';
import { SNS_TOPIC_ARN } from '@src/constants';
import { validateSnsAction, responseBody } from '@src/services/httpUtils';
import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const { valid, response, payload, action } = validateSnsAction(event);
  if (!valid) return response;

  try {
    const sns = new SNS();
    const published = await sns
      .publish({
        Message: JSON.stringify(payload),
        TopicArn: SNS_TOPIC_ARN,
        Subject: 'Messages',
        MessageAttributes: {
          action: {
            DataType: 'String',
            StringValue: action,
          },
        },
      })
      .promise();
    return {
      statusCode: 200,
      body: responseBody({
        message: 'Message created.',
        action,
        object: { messageId: published.MessageId },
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
