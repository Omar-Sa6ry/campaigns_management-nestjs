import { CampaignModule } from './../campaign/campaign.module'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TicketService } from './ticket.service'
import { TicketResolver } from './ticket.resolver'
import { Ticket } from './entity/ticket.entity'
import { User } from '../users/entity/user.entity'
import { Campaign } from '../campaign/entity/campaign.entity'
import { RedisModule } from 'src/common/redis/redis.module'
import { UserModule } from '../users/users.module'
import { WebSocketModule } from 'src/common/websocket/websocket.module'
import { Ad } from '../ad/entity/ad.entity'
import { Partner } from '../partner/entity/partner.entity'
import { ticketLoader } from './loader/ticket.loader'
import { SendTicketService } from 'src/common/queues/ticket/sendticket.service'
import { TicketQueue } from 'src/common/queues/ticket/sendTicket.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, User, Campaign, Partner, Ad, Campaign]),
    RedisModule,
    CampaignModule,
    UserModule,
    WebSocketModule,
    TicketQueue,
  ],
  providers: [TicketService, TicketResolver, SendTicketService, ticketLoader],
  exports: [TicketService],
})
export class TicketModule {}
