import { CampaignModule } from './../campaign/campaign.module'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TicketService } from './ticket.service'
import { TicketResolver } from './ticket.resolver'
import { Ticket } from './entity/ticket.entity'
import { User } from '../users/entity/user.entity'
import { Campaign } from '../campaign/entity/campaign.entity'
import { CampaignLoader } from '../campaign/loader/campaign.loader'
import { UserLoader } from '../users/loader/user.loader'
import { RedisModule } from 'src/common/redis/redis.module'
import { UserModule } from '../users/users.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { Ad } from '../ad/entity/ad.entity'
import { Partner } from '../partner/entity/partner.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, User, Partner, Ad, Campaign]),
    RedisModule,
    CampaignModule,
    UserModule,
    WebSocketModule,
  ],
  providers: [TicketService, TicketResolver, CampaignLoader, UserLoader],
  exports: [TicketService],
})
export class TicketModule {}
