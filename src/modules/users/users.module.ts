import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserService } from './users.service'
import { UserResolver } from './users.resolver'
import { QueueModule } from 'src/common/queue/queue.module'
import { RedisModule } from 'src/common/redis/redis.module'
import { User } from './entity/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([User]), QueueModule, RedisModule],
  providers: [UserService, UserResolver],
  exports: [UserService],
})
export class UserModule {}
