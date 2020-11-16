// eslint-disable-next-line
export const handler = async (event: any, _context: any) => {
  // Placeholder for looking up or validating channelIds, for now the application
  // will pass the data through.
  return { channels: event.channelIds };
};

export default handler;
