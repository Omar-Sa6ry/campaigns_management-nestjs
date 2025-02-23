import { Module } from '@nestjs/common'
import { AppService } from './app.service'
import { AuthModule } from './modules/auth/auth.module'
import { UserModule } from './modules/users/users.module'
import { GraphqlModule } from './common/graphql/graphql.module'
import { ThrottlerModule } from './common/throttler/throttling.module'
import { DataBaseModule } from './common/database/database'
import { ConfigModule } from './common/config/config.module'
import { AppResolver } from './app.resolver'
import { PartnerModule } from './modules/partner/partner.module'
import { AdModule } from './modules/ad/ad.module'
import { CampaignModule } from './modules/campaign/campaign.module'
// import { UserCampaignModule } from './modules/userCampaign/userCampaign.module'
import { InteractionModule } from './modules/interaction/interaction.module'
import { TicketModule } from './modules/ticket/ticket.module'
import { PartnerRequestModule } from './modules/request/request.module'
import { ScheduleModule } from '@nestjs/schedule'

@Module({
  imports: [
    ConfigModule,
    GraphqlModule,
    DataBaseModule,
    ThrottlerModule,
    ScheduleModule.forRoot(),

    AuthModule,
    UserModule,
    PartnerModule,
    CampaignModule,
    // UserCampaignModule,
    InteractionModule,
    AdModule,
    TicketModule,
    PartnerRequestModule,
  ],

  providers: [AppService, AppResolver],
})
export class AppModule {}
