import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(
      `redis://:${process.env.REDIS_PASSWORD}@w8wskg4:6379/0`,
    );
  }

  async getClient() {
    return this.redis;
  }
}
