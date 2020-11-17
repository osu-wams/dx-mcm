import Message, { Status } from '@src/models/message';

interface MessageError extends Message {
  error: {
    Error: string;
    Cause: string;
  };
}

// eslint-disable-next-line
export const handler = async (event: MessageError, _context: any) => {
  const {
    id,
    sendAt,
    error: { Cause },
  } = { ...event };
  let errorMessage;
  try {
    errorMessage = JSON.parse(Cause).errorMessage;
  } catch {
    errorMessage = Cause;
  }
  const message = await Message.find(sendAt, id!);
  if (message) {
    await Message.updateStatus(message, Status.ERROR, errorMessage);
  } else {
    console.error(`Message.find(${sendAt}, ${id}) failed, unable to set status.`);
  }
  return event.error;
};

export default handler;
