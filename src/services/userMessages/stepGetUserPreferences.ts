import { channelExists } from '@src/models/userMessage';

export const handler = async (event: any, context: any, callback: any) => {
  console.log('Handling event, context -->  ', event, context);

  // TODO: Lookup the users preferences to ensure this usermessage is only being sent if the
  // users preferences allow for it.

  const sendToChannel = channelExists(event);
  callback(null, { sendToChannel });
};

export default handler;
