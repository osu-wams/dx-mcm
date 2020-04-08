// TODO: find appropriate type for event
export const handler = async (event: any) => {
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
