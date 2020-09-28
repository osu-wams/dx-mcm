import serverless from 'serverless-http';
import express, { Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import { errorHandler } from '@src/services/expressUtils';
import Message, { Status } from '@src/models/message';

const API_BASE_URL = '/api/v1/message';

const app = express();

// eslint-disable-next-line no-unused-vars
const findById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);
    if (!message) {
      res.status(400).json({ error: `Message ${id} not found.` });
    } else {
      res.status(200).json({ message });
    }
  } catch (err) {
    errorHandler(err, req, res, next);
  }
};

// eslint-disable-next-line no-unused-vars
const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const message = await Message.findById(id);
    if (!message) {
      res.status(400).json({ error: `Message ${id} not found.` });
    } else {
      const updatedMessage = await Message.updateStatus(
        message,
        status,
        'Status updated through messages API.',
      );
      res.status(200).json({ message: updatedMessage });
    }
  } catch (err) {
    errorHandler(err, req, res, next);
  }
};

// eslint-disable-next-line no-unused-vars
const cancel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);
    if (!message) {
      res.status(400).json({ error: `Message ${id} not found.` });
    } else if (message.status === Status.SENT) {
      res.status(400).json({ error: `Message ${id} has already been sent.` });
    } else {
      const updatedMessage = await Message.updateStatus(
        message,
        Status.CANCELLED,
        'Status cancelled through messages API.',
      );
      res.status(200).json({ message: updatedMessage });
    }
  } catch (err) {
    errorHandler(err, req, res, next);
  }
};

app.get(`${API_BASE_URL}/:id`, findById);
app.post(`${API_BASE_URL}/:id`, express.json({ type: '*/*' }), update);
app.post(`${API_BASE_URL}/:id/cancel`, cancel);

export const handler = serverless(app);
export default handler;
