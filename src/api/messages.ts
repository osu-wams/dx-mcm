import { APIGatewayProxyHandler } from 'aws-lambda';
import { SNS } from 'aws-sdk';
import { validate, responseBody } from './utils';

export const handler: APIGatewayProxyHandler = async (event, _context) => {
  const { valid, response, payload, action } = validate(event);
  if (!valid) return response;

  try {
    const sns = new SNS();
    const published = await sns
      .publish({
        Message: JSON.stringify(payload),
        TopicArn: process.env.SNS_TOPIC_ARN,
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
      body: responseBody({ requestId: published.MessageId, action }),
    };
  } catch (error) {
    console.dir(error, { depth: null, showHidden: true });
    return {
      statusCode: 500,
      body: responseBody({ error, action }),
    };
  }
};
