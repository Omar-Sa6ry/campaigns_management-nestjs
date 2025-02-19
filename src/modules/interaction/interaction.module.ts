import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { InteractionService } from './interaction.service'
import { InteractionResolver } from './interaction.resolver'
import { Interaction } from './entity/interaction.entity'
import { User } from '../users/entity/user.entity'
import { RedisModule } from 'src/common/redis/redis.module'
import { UserModule } from '../users/users.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { AdModule } from '../ad/ad.module'
import { Ad } from '../ad/entity/ad.entity'
import { InteractionLoader } from './loader/interaction.loader'
import { Campaign } from '../campaign/entity/campaign.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Interaction, Campaign, Ad, User]),
    RedisModule,
    UserModule,
    AdModule,
    WebSocketModule,
  ],
  providers: [InteractionService, InteractionResolver, InteractionLoader],
})
export class InteractionModule {}
