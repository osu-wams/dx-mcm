export const handler = async (event: any, _context: any, callback: any) => {
  console.log('Handling event -->  ', event);
  // TODO: Lookup the users preferences to ensure this usermessage is only being sent if the
  // users preferences allow for it.
  callback(null, { sendToChannel: true });
};

export default handler;
