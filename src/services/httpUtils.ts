import { APIGatewayProxyEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved

export interface IResponseBodyArgs {
  error?: Error;
  requestId?: string;
  message?: string;
  object?: object;
  action: string | undefined;
}

export const responseBody = ({
  error,
  requestId,
  action,
  message,
  object,
}: IResponseBodyArgs): string => {
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
    object,
  });
};

export const validateSnsAction = (event: APIGatewayProxyEvent) => {
  const result = {
    valid: false,
    response: { statusCode: 400, body: JSON.stringify({ message: 'Bad Request' }) },
    payload: {},
    action: event.path.toLowerCase(),
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
