import { APIGatewayProxyHandler } from "aws-lambda";
import { SQS } from "aws-sdk";

const config = {
  endpoint: process.env.SQS_HOST,
  accessKeyId: "na",
  secretAccessKey: "na",
  region: "us-west-2"
};

const sqs = new SQS(config);

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
  const queueUrl: string = `${process.env.SQS_HOST}/${process.env.SQS_AWS_ACCOUNT_ID}/${process.env.SQS_QUEUE_NAME}`;
  try {
    await sqs
      .sendMessage({
        QueueUrl: queueUrl,
        MessageBody: event.body,
        MessageAttributes: {
          AttributeNameHere: {
            StringValue: "Attribute Value Here",
            DataType: "String"
          }
        }
      })
      .promise();

    message = "Message placed in the Queue!";
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
