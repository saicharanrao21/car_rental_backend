import { Module, Global, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';

export const REDIS_CLIENT = 'REDIS_CLIENT';

const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (configService: ConfigService) => {
    const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    
    // Check if we are running in an environment without Docker/Redis and fall back to Mock
    if (process.env.NODE_ENV === 'production') {
      return new Redis(redisUrl);
    } else {
      console.log('Using ioredis-mock for local development environment');
      return new RedisMock();
    }
  },
  inject: [ConfigService],
};

@Global()
@Module({
  providers: [redisProvider],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
