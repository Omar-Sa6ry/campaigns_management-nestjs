import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserCampaignService } from './userCampaign.service'
import { UserCampaign } from './entity/userCampaign.entity'
import { UserCampaignResolver } from './userCampaign.resolver'
import { RedisModule } from 'src/common/redis/redis.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { UserModule } from '../users/users.module'
import { CampaignModule } from '../campaign/campaign.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserCampaign]),
    RedisModule,
    CampaignModule,
    UserModule,
    WebSocketModule,
  ],
  providers: [UserCampaignResolver, UserCampaignService],
})
export class UserCampaignModule {}
