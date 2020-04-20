export const handler = async (event: any, _context: any, callback: any) => {
  // Placeholder for looking up or validating channelIds, for now the application
  // will pass the data through.
  callback(null, { channels: event.channelIds });
};

export default handler;
