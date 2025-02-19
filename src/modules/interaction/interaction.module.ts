import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { InteractionService } from './interaction.service'
import { InteractionResolver } from './interaction.resolver'
import { Interaction } from './entity/interaction.entity'
import { User } from '../users/entity/user.entity'
import { UserLoader } from '../users/loader/user.loader'
import { AdLoader } from '../ad/loader/ad.loader'
import { RedisModule } from 'src/common/redis/redis.module'
import { UserModule } from '../users/users.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { AdModule } from '../ad/ad.module'
import { Ad } from '../ad/entity/ad.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Interaction, Ad, User]),
    RedisModule,
    UserModule,
    AdModule,
    WebSocketModule,
  ],
  providers: [InteractionService, InteractionResolver, UserLoader, AdLoader],
})
export class InteractionModule {}
