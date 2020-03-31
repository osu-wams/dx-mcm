import { APIGatewayProxyHandler } from "aws-lambda";
import { SNS } from "aws-sdk";

const sns = new SNS();

export const handler: APIGatewayProxyHandler = async (event, context) => {
  console.log(context);
  let statusCode: number = 200;
  let message: string;

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "No body was found"
      })
    };
  }
  try {
    const result = await sns
      .publish({
        Message: event.body,
        TopicArn: process.env.SNS_TOPIC_ARN
      })
      .promise();

    message = result.MessageId as string;
  } catch (error) {
    console.log("boom");
    console.dir(error, { depth: null, showHidden: true });
    message = error;
    statusCode = 500;
  }

  return {
    statusCode,
    body: JSON.stringify({
      message
    })
  };
};
