import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserService } from './users.service'
import { UserResolver } from './users.resolver'
import { EmailModule } from 'src/common/queues/email/email.module'
import { RedisModule } from 'src/common/redis/redis.module'
import { User } from './entity/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([User]), EmailModule, RedisModule],
  providers: [UserService, UserResolver],
  exports: [UserService],
})
export class UserModule {}
