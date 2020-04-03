import dotenv from 'dotenv';

const loadConfig = () => {
  if (process.env.LOAD_DOTENV) {
    dotenv.config({
      debug: Boolean(process.env.DEBUG),
      path: `${process.cwd()}/.env.development`,
    });
  }
};

loadConfig();
