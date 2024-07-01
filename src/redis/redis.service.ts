import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      password: process.env.REDIS_PASSWORD,
      port: Number(process.env.REDIS_PORT),
      username: 'default',
      db: 0,
    });
  }

  async getClient() {
    return this.redis;
  }
}
