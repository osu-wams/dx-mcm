export const handler = async (event: any, _context: any, callback: any) => {
  console.log(event);
  callback(null, { users: ['123456789', '987654321'] });
};

export default handler;