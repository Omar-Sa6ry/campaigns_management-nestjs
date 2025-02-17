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
import { UserLoader } from 'src/common/loaders/user.loader'
import { CampaignLoader } from 'src/common/loaders/campaign.loader'
import { AdLoader } from 'src/common/loaders/ad.loader'
import { Ad } from '../ad/entity/ad.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserCampaign, Ad, Campaign, User]),
    RedisModule,
    CampaignModule,
    UserModule,
    WebSocketModule,
  ],
  providers: [
    UserCampaignResolver,
    UserCampaignService,
    UserLoader,
    CampaignLoader,
    AdLoader,
  ],
})
export class UserCampaignModule {}
