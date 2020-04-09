import { SNSEvent } from 'aws-lambda'; // eslint-disable-line no-unused-vars, import/no-unresolved

export const handler = async (event: SNSEvent) => {
  try {
    const record = event.Records.shift();
    if (!record) return;
    const messageAttributes = record.Sns.MessageAttributes;
    console.log('Message Attributes -->  ', messageAttributes);
    console.log('Message Subject -->  ', record.Sns.Subject);
    console.log('Message Body -->  ', record.Sns.Message);
  } catch (error) {
    console.log(error);
  }
};

export default handler;
