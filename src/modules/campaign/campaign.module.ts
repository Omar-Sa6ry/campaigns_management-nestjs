import { Module } from '@nestjs/common'
import { CampaignResolver } from './campaign.resolver'
import { CampaignService } from './campaign.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Campaign } from './entity/campaign.entity'
import { RedisModule } from 'src/common/redis/redis.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { UserModule } from '../users/users.module'
import { Ad } from '../ad/entity/ad.entity'
import { AdLoader } from 'src/common/loaders/ad.loader'

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, Ad]),
    UserModule,
    RedisModule,
    WebSocketModule,
  ],
  providers: [CampaignResolver, CampaignService,AdLoader],
  exports: [CampaignService],
})
export class CampaignModule {}
