import { SNS_TOPIC_ARN } from '@src/constants';
import { validateSnsAction, responseBody } from '@src/services/httpUtils';
import { publish } from '@src/messagePubSub';
import { APIGatewayProxyEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved
import { AWSError, SNS } from 'aws-sdk'; // eslint-disable-line no-unused-vars

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
        message: 'Action published.',
        action,
        object: { id: (published as SNS.PublishResponse).MessageId, payload },
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
