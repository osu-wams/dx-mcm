import serverless from 'serverless-http';
import express, { Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import { errorHandler } from '@src/services/expressUtils';
import UserMessage, { ChannelId, Status } from '@src/models/userMessage';
import UserMessagePending from '@src/models/userMessagePending';
import { USER_MESSAGE_API_PATH } from '@src/constants';
import { publishUserMessagesToQueue } from '@src/services/sqsUtils';

const app = express();

const findByChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const action = 'user-messages-find-by-channel';

    const { channelId, userId, lastKey } = req.params;
    const [onid] = (userId ?? '').split('-'); // eslint-disable-line no-unused-vars

    const selectedChannel = ChannelId[channelId.toUpperCase() as keyof typeof ChannelId];
    if (!selectedChannel) throw new Error('Missing valid channelId in path.');
    const userMessageResults = await UserMessage.byChannel(onid, selectedChannel, lastKey);

    res.status(200).json({
      action,
      object: { userMessageResults },
    });
  } catch (err) {
    errorHandler(err, req, res, next);
  }
};

const markRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const action = 'user-message-mark-read';
    const { userId, channelId, messageId } = req.params;
    if (!userId)
      throw new Error(`Missing userId ({onid}-{osuId}) in path. Path parameters: ${req.params}`);
    if (!channelId) throw new Error(`Missing channelId in path. Path parameters: ${req.params}`);
    if (!messageId) throw new Error(`Missing messageId in path. Path parameters: ${req.params}`);
    const [onid] = (userId ?? '').split('-'); // eslint-disable-line no-unused-vars

    const userMessageResults = await UserMessage.find({ id: onid, messageId, channelId });
    if (userMessageResults.count !== 1) {
      console.error(
        `Marking UserMessage read failed, found ${userMessageResults.count} records for userId:${userId}, messageId:${messageId}, channelId:${channelId}`,
      );
      res.status(409).json({ action, message: 'Mark message as read failed.' });
    } else {
      const userMessageStatusResults = await UserMessage.updateStatus(
        userMessageResults.items[0],
        Status.READ,
      );
      res.status(200).json({
        action,
        object: { userMessage: userMessageStatusResults.items[0] },
      });
    }
  } catch (err) {
    errorHandler(err, req, res, next);
  }
};

const findByStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const action = 'user-message-pending-find-by-status';
    const { status, fromDate, lastKey } = req.params;
    const pendingMinAgo = (Date.now() - Date.parse(fromDate)) / 1000 / 60;
    const userMessageResults = await UserMessagePending.updatedSince(
      status.toUpperCase(),
      pendingMinAgo,
      lastKey,
    );
    res.status(200).json({ action, object: { userMessageResults } });
  } catch (err) {
    errorHandler(err, req, res, next);
  }
};

const findError = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const action = 'user-message-pending-find-error';
    const { messageChannelUser } = req.params; // # delimiter must be urlencoded as %23
    const userMessageResults = await UserMessagePending.find({ messageChannelUser });
    res.status(200).json({ action, object: { userMessageResults } });
  } catch (err) {
    errorHandler(err, req, res, next);
  }
};

const retrySendingUserMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const action = 'user-message-pending-retry-errors';
    const { ids }: { ids: string[] } = req.body;
    const items = await UserMessagePending.batchGet(Status.ERROR, ids);
    const userMessages = items.map((i) => new UserMessage({ userMessage: i }));
    await publishUserMessagesToQueue(userMessages);
    for (let i = 0; i < items.length; i += 1) {
      const { id, channelId, messageId } = items[i];
      // eslint-disable-next-line
      await UserMessagePending.delete({ id, channelId, messageId, status: Status.ERROR });
    }
    res.status(200).json({ action, object: { items } });
  } catch (err) {
    errorHandler(err, req, res, next);
  }
};

app.get(`${USER_MESSAGE_API_PATH}/channel/:channelId/:userId/:lastKey?`, findByChannel);
app.get(`${USER_MESSAGE_API_PATH}/read/:channelId/:messageId/:userId`, markRead);
app.get(`${USER_MESSAGE_API_PATH}/status/:status/:fromDate/:lastKey?`, findByStatus);
app.get(`${USER_MESSAGE_API_PATH}/error/:messageChannelUser`, findError);
app.post(
  `${USER_MESSAGE_API_PATH}/error/retry`,
  express.json({ type: '*/*' }),
  retrySendingUserMessages,
);

export const handler = serverless(app);
export default handler;
