import { Module } from '@nestjs/common'
import { AdService } from './ad.service'
import { AdResolver } from './ad.resolver'
import { Ad } from './entity/ad.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserModule } from '../users/users.module'
import { RedisModule } from 'src/common/redis/redis.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { UploadModule } from 'src/common/upload/upload.module'
import { CampaignModule } from '../campaign/campaign.module'
import { UserCampaign } from '../userCampaign/entity/userCampaign.entity'
import { AdLoader } from 'src/modules/ad/loader/ad.loader'
import { CampaignLoader } from 'src/modules/campaign/loader/campaign.loader'
import { Campaign } from '../campaign/entity/campaign.entity'
import { Partner } from '../partner/entity/partner.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Ad, Campaign, Partner, UserCampaign]),
    UserModule,
    UploadModule,
    CampaignModule,
    RedisModule,
    WebSocketModule,
  ],
  providers: [AdService, AdResolver, CampaignLoader, AdLoader],
  exports: [AdService],
})
export class AdModule {}
