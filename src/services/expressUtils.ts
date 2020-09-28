import { Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars

// eslint-disable-next-line no-unused-vars
export const errorHandler = async (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('errorHandler -->  ');
  console.dir(err);
  const status = err.status || 500;
  const message = err.message || '';
  const data = err.data || null;
  res.status(status).json({ message, data });
};

export default {
  errorHandler,
};
