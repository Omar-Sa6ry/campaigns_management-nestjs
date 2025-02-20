import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PartnerRequestResolver } from './request.resolver'
import { PartnerRequestService } from './request.service'
import { PartnerRequest } from './entity/partnerRequest.entity'
import { Partner } from '../partner/entity/partner.entity'
import { Campaign } from '../campaign/entity/campaign.entity'
import { Ad } from '../ad/entity/ad.entity'
import { User } from '../users/entity/user.entity'
import { RequestLoader } from './loader/request.loader'
import { PartnerModule } from '../partner/partner.module'
import { UserModule } from '../users/users.module'
import { RedisModule } from 'src/common/redis/redis.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([PartnerRequest, Partner, Campaign, Ad, User]),
    PartnerModule,
    UserModule,
    RedisModule,
    WebSocketModule,
  ],
  providers: [PartnerRequestResolver, PartnerRequestService, RequestLoader],
})
export class PartnerRequestModule {}
