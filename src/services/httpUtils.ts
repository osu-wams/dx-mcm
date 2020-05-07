import { APIGatewayProxyEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved

interface IResponseArgs {
  successCode?: number;
  errorCode?: number;
  cacheSeconds?: number;
  body: string;
}

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

/**
 * A standard successful response from an API Gateway oriented lambda response
 * @param args parameters for specifying status, caching, etc for the response
 */
export const successResponse = (args: IResponseArgs) => {
  return {
    statusCode: args.successCode ?? 200,
    headers: {
      'Cache-Control': `public,max-age=${args.cacheSeconds ?? 15}`,
    },
    body: args.body,
  };
};

/**
 * A standard error response from an API Gateway oriented lambda response.
 * ! Error response are configured to be cached by Cloudfront with a MinTTL of 60 seconds
 * @param args parameters for specifying status, caching, etc for the response
 */
export const errorResponse = (args: IResponseArgs) => {
  return {
    statusCode: args.errorCode ?? 500,
    headers: {
      'Cache-Control': 'public,max-age=60,must-revalidate',
    },
    body: args.body,
  };
};
