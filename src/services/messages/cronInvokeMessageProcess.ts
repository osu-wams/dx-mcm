// eslint-disable-next-line no-unused-vars
import axios, { AxiosRequestConfig } from 'axios';

// eslint-disable-next-line no-unused-vars
export const handler = async (_event: any, _context: any, _callback: any) => {
  try {
    // post to /api/v1/messages/action/process with x-api-key in header
    const config: AxiosRequestConfig = {
      method: 'post', // you can set what request you want to be
      url: process.env.APP_URL,
      data: { payload: {} },
      headers: {
        'x-api-key': process.env.API_KEY || "",
      },
    };
    await axios(config);
    // callback(null, { userMessages });
  } catch (err) {
    // callback(err, null);
  }
};

export default handler;
