import redis from 'redis';

const DEFAULT_DB: number = 0;

export default class Cache {
  client: redis.RedisClient;

  db: number = DEFAULT_DB;

  constructor(host: string, port: number, db: number = DEFAULT_DB) {
    this.db = db;
    this.client = redis.createClient({
      host,
      port,
      db,
    });
    this.client.on('error', (err) => console.error(`cache: redisClient.on('error'): ${err}`));
  }

  async get<T>(key: string): Promise<T | undefined> {
    await this.selectDb();
    const reply = await new Promise<T | undefined>((resolve, reject) => {
      this.client.get(key, (err, data) => {
        if (err) reject(err);
        if (data) resolve(JSON.parse(data.toString()));
        if (!data) resolve(undefined);
      });
    });
    if (!reply) {
      console.debug(`getCache(${key}) did not find data.`);
      return reply;
    }
    return reply;
  }

  async set(
    key: string,
    data: string,
    options?: { mode: string; duration: number; flag: string },
  ): Promise<boolean> {
    await this.selectDb();
    return new Promise((resolve, reject) => {
      if (options) {
        const { mode, duration, flag } = options;
        this.client.set(key, data, mode, duration, flag, (err, reply) => {
          if (err) reject(err);
          resolve(reply === 'OK');
        });
      } else {
        this.client.set(key, data, (err, reply) => {
          if (err) reject(err);
          resolve(reply === 'OK');
        });
      }
    });
  }

  async selectDb(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.client.select(this.db, (err) => {
        if (err) reject(err);
        resolve(true);
      });
    });
  }
}
