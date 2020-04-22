export const handler = async (event: any, context: any, callback: any) => {
  console.log('Handling event, context -->  ', event, context);

  // TODO: Identify whether or not this UserMessage should continue being published or needs to be delayed because
  // the user has had too many messages published. Establish some sort of flow control.

  callback(null, { sendUserMessages: [event.channelMessageId] });
};

export default handler;
