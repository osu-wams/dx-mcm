import { APIGatewayProxyHandler } from "aws-lambda";
import { SNS } from "aws-sdk";

const sns = new SNS();

export const handler: APIGatewayProxyHandler = async (event, context) => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "No body was found"
      })
    };
  }
  try {
    console.log(context);
    let statusCode: number = 200;
    let message: string;
    const { execute } = JSON.parse(event.body);
    const result = await sns
      .publish({
        Message: event.body,
        TopicArn: process.env.SNS_TOPIC_ARN,
        MessageAttributes: {
          execute: {
            DataType: "String",
            StringValue: execute
          }
        }
      })
      .promise();

    message = result.MessageId as string;
    return {
      statusCode,
      body: JSON.stringify({
        message,
        execute
      })
    };
  } catch (error) {
    console.log("boom");
    console.dir(error, { depth: null, showHidden: true });
    return {
      statusCode: 500,
      body: JSON.stringify({
        error
      })
    };
  }
};
