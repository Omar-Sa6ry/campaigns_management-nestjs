import { Module } from '@nestjs/common'
import { CampaignResolver } from './campaign.resolver'
import { CampaignService } from './campaign.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Campaign } from './entity/campaign.entity'
import { RedisModule } from 'src/common/redis/redis.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { UserModule } from '../users/users.module'
import { Ad } from '../ad/entity/ad.entity'
import { Partner } from '../partner/entity/partner.entity'
import { CampaignLoader } from './loader/campaign.loader'
import { NotificationModule } from 'src/common/notification/notification.module'
import { User } from '../users/entity/user.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, User, Partner, Ad]),
    UserModule,
    NotificationModule,
    RedisModule,
    WebSocketModule,
  ],
  providers: [CampaignResolver, CampaignService, CampaignLoader],
  exports: [CampaignService],
})
export class CampaignModule {}
