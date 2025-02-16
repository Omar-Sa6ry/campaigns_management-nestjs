import { Module } from '@nestjs/common'
import { CampaignResolver } from './campaign.resolver'
import { CampaignService } from './campaign.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Campaign } from './entity/campaign.entity'
import { RedisModule } from 'src/common/redis/redis.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { UserModule } from '../users/users.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign]),
    UserModule,
    RedisModule,
    WebSocketModule,
  ],
  providers: [CampaignResolver, CampaignService],
  exports: [CampaignService],
})
export class CampaignModule {}
