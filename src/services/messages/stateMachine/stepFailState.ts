import Message, { Status } from '@src/models/message';

interface MessageError extends Message {
  error: {
    Error: string;
    Cause: string;
  };
}

export const handler = async (event: MessageError, _context: any, callback: any) => {
  const {
    id,
    sendAt,
    error: { Cause },
  } = { ...event };
  const { errorMessage } = JSON.parse(Cause);
  const message = await Message.find(sendAt, id!);
  if (message) {
    await Message.updateStatus(message, Status.ERROR, errorMessage);
  } else {
    console.error(`Message.find(${sendAt}, ${id}) failed, unable to set status.`);
  }
  callback(event.error, null);
};

export default handler;
