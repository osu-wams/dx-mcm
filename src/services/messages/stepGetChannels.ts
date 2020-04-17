export const handler = async (event: any, _context: any, callback: any) => {
  console.log(event);
  callback(null, { channels: ['channel-1', 'channel-2'] });
};

export default handler;
