import serverless from 'serverless-http';
import express, { Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import errorHandler from '@src/services/messages/api/errorHandler';
import Message from '@src/models/message';

const API_BASE_URL = '/api/v1/message';

const app = express();

// eslint-disable-next-line no-unused-vars
const findById = async (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  const message = await Message.findById(id);
  res.status(200).json({ message });
};

app.get(`${API_BASE_URL}/:id`, findById);

app.use(errorHandler);

export const handler = serverless(app);
export default handler;
