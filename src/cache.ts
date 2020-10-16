import redis from 'redis';

const DEFAULT_DB: number = 0;

export default class Cache {
  client: redis.RedisClient;

  host: string;

  port: number;

  db: number = DEFAULT_DB;

  constructor(host: string, port: number, db: number = DEFAULT_DB) {
    this.db = db;
    this.host = host;
    this.port = port;
    this.client = this.createClient();
  }

  createClient(): redis.RedisClient {
    const client = redis.createClient({ host: this.host, port: this.port, db: this.db });
    client.on('error', (err) => console.error(`cache: redisClient.on('error'): ${err}`));
    return client;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const reply = await new Promise<string | undefined>((resolve, reject) => {
      this.client.get(key, (err, data) => {
        if (err) reject(err);
        if (data) resolve(data);
        if (!data) resolve(undefined);
      });
    });
    if (!reply) {
      console.debug(`getCache(${key}) did not find data.`);
      return undefined;
    }
    console.log('get returning', reply);
    return JSON.parse(reply);
  }

  async set(
    key: string,
    data: string,
    options?: { mode: string; duration: number; flag: string },
  ): Promise<boolean> {
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
