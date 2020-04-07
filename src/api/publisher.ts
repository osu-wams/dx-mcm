import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { SNS } from 'aws-sdk';

export const handler: APIGatewayProxyHandler = async (event, _context) => {
  const { valid, response, payload, action } = validate(event);
  if (!valid) return response;

  try {
    const sns = new SNS();
    const published = await sns
      .publish({
        Message: JSON.stringify(payload),
        TopicArn: process.env.SNS_TOPIC_ARN,
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
interface IResponseBodyArgs {
  error?: Error;
  requestId?: string;
  message?: string;
  action: string | undefined;
}

const responseBody = ({ error, requestId, action, message }: IResponseBodyArgs): string => {
  if (error) {
    return JSON.stringify({
      requestId,
      message: error.message,
      action,
    });
  }

  return JSON.stringify({
    requestId,
    message,
    action,
  });
};

const validate = (event: APIGatewayProxyEvent) => {
  const result = {
    valid: false,
    response: { statusCode: 400, body: JSON.stringify({ message: 'Bad Request' }) },
    payload: {},
    action: event.path.split('/').pop()?.toLowerCase(),
  };

  try {
    if (!event.body) {
      result.response.body = responseBody({ message: 'Missing data.', action: result.action });
    } else {
      const body = JSON.parse(event.body);
      if (body.payload) {
        result.valid = true;
        result.response.statusCode = 200;
        result.payload = body.payload;
      } else {
        result.response.body = responseBody({
          message: 'Missing data payload.',
          action: result.action,
        });
      }
    }
  } catch (error) {
    result.response.statusCode = 500;
    result.response.body = responseBody({ error, action: result.action });
  }

  return result;
};
