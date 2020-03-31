import { SNSHandler, SNSMessageAttributes } from "aws-lambda";

export const handler: SNSHandler = async (event, context, _callback) => {
  try {
    for (const record of event.Records) {
      const messageAttributes: SNSMessageAttributes =
        record.Sns.MessageAttributes;
      console.log(context);
      console.log("Message Attributes -->  ", messageAttributes);
      console.log("Message Subject -->  ", record.Sns.Subject);
      console.log("Message Body -->  ", record.Sns.Message);
    }
  } catch (error) {
    console.log(error);
  }
};
