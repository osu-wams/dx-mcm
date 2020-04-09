import dotenv from 'dotenv';

const loadConfig = () => {
  if (process.env.DOTENV_CONFIG_PATH) {
    dotenv.config({
      debug: Boolean(process.env.DEBUG),
      path: process.env.DOTENV_CONFIG_PATH,
    });
  }
};

loadConfig();
