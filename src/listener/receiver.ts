import { SNSEvent } from 'aws-lambda';

export const handler = async (event: SNSEvent) => {
  try {
    for (const record of event.Records) {
      const messageAttributes = record.Sns.MessageAttributes;
      console.log('Message Attributes -->  ', messageAttributes);
      console.log('Message Subject -->  ', record.Sns.Subject);
      console.log('Message Body -->  ', record.Sns.Message);
    }
  } catch (error) {
    console.log(error);
  }
};
