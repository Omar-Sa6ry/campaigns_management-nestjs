import { Module } from '@nestjs/common'
import { CampaignResolver } from './campaign.resolver'
import { CampaignService } from './campaign.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Campaign } from './entity/campaign.entity'
import { RedisModule } from 'src/common/redis/redis.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { UserModule } from '../users/users.module'
import { Ad } from '../ad/entity/ad.entity'
import { AdLoader } from 'src/modules/ad/loader/ad.loader'
import { Partner } from '../partner/entity/partner.entity'
import { PartnerLoader } from '../partner/loader/partner.loader'
import { CampaignLoader } from './loader/campaign.loader'

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, Partner, Ad]),
    UserModule,
    RedisModule,
    WebSocketModule,
  ],
  providers: [CampaignResolver, CampaignService, CampaignLoader],
  exports: [CampaignService],
})
export class CampaignModule {}
