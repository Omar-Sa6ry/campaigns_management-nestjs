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
import { PartnerModule } from '../partner/partner.module'
import { UserCampaignLoader } from './loader/userCampaign.loader'
import { Ad } from '../ad/entity/ad.entity'
import { Partner } from '../partner/entity/partner.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserCampaign, Ad, Partner, Campaign, User]),
    RedisModule,
    PartnerModule,
    CampaignModule,
    UserModule,
    WebSocketModule,
  ],
  providers: [UserCampaignResolver, UserCampaignService, UserCampaignLoader],
})
export class UserCampaignModule {}
