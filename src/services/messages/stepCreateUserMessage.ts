export const handler = async (event: any, _context: any, callback: any) => {
  console.log(event);
  callback(null, { userMessage: { id: 123 } });
};

export default handler;
