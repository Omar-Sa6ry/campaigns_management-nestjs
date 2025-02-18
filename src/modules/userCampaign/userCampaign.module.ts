import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserCampaignService } from './userCampaign.service'
import { UserCampaign } from './entity/userCampaign.entity'
import { UserCampaignResolver } from './userCampaign.resolver'
import { RedisModule } from 'src/common/redis/redis.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { UserModule } from '../users/users.module'
import { CampaignModule } from '../campaign/campaign.module'
import { User } from '../users/entity/user.entity'
import { Campaign } from '../campaign/entity/campaign.entity'
import { UserLoader } from 'src/modules/users/loader/user.loader'
import { CampaignLoader } from 'src/modules/campaign/loader/campaign.loader'
import { AdLoader } from 'src/modules/ad/loader/ad.loader'
import { Ad } from '../ad/entity/ad.entity'
import { PartnerLoader } from 'src/modules/partner/loader/partner.loader'
import { Partner } from '../partner/entity/partner.entity'
import { PartnerModule } from '../partner/partner.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserCampaign, Ad, Partner, Campaign, User]),
    RedisModule,
    PartnerModule,
    CampaignModule,
    UserModule,
    WebSocketModule,
  ],
  providers: [
    UserCampaignResolver,
    UserCampaignService,
    UserLoader,
    PartnerLoader,
    CampaignLoader,
    AdLoader,
  ],
})
export class UserCampaignModule {}
