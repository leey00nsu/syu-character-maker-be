import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as timezone from 'dayjs/plugin/timezone';
import * as utc from 'dayjs/plugin/utc';
import { RedisService } from 'src/redis/redis.service';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class ArticleLimitService {
  constructor(private redisService: RedisService) {}

  async isAvailable(userId: number) {
    const currentLimit = await this.getLimitCount(userId);

    return currentLimit < 5;
  }

  async increasaeLimitCount(userId: number) {
    const client = await this.redisService.getClient();

    const key = `article-limit-${userId}`;

    const currentLimit = await this.getLimitCount(userId);

    // 기존에 저장된 값에 1을 더해 저장
    // 이때 만료 시간은 자정까지 남은 시간으로 설정
    const limit = await client.set(
      key,
      currentLimit + 1,
      'EX',
      this.getExpireTime(),
    );

    return limit;
  }

  async getLimitCount(userId: number) {
    const client = await this.redisService.getClient();

    const key = `article-limit-${userId}`;

    const limit = await client.get(key);

    return limit === null ? 0 : Number(limit);
  }

  async resetLimitCount(userId: number) {
    const client = await this.redisService.getClient();

    const key = `article-limit-${userId}`;

    const limit = await client.set(key, 0);

    return limit;
  }

  getExpireTime() {
    const now = dayjs();
    const midnight = dayjs().endOf('day');

    // 자정까지 남은 시간을 초 단위로 반환
    const secondUntilMidnight = midnight.diff(now, 'second');

    return secondUntilMidnight;
  }
}
