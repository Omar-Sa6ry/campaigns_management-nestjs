import { Module } from '@nestjs/common'
import { PartnerResolver } from './partner.resolver'
import { PartnerService } from './partner.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Partner } from './entity/partner.entity'
import { Campaign } from '../campaign/entity/campaign.entity'
import { RedisModule } from 'src/common/redis/redis.module'
import { UserModule } from '../users/users.module'
import { CampaignLoader } from 'src/modules/campaign/loader/campaign.loader'
import { PartnerLoader } from 'src/modules/partner/loader/partner.loader'
import { Ad } from '../ad/entity/ad.entity'
import { CampaignModule } from '../campaign/campaign.module'
import { UserCampaign } from '../userCampaign/entity/userCampaign.entity'
import { AdModule } from '../ad/ad.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Partner, Ad, UserCampaign, Campaign]),
    RedisModule,
    UserModule,
    CampaignModule,
    AdModule,
  ],
  providers: [PartnerResolver, PartnerService, PartnerLoader, CampaignLoader],
  exports: [PartnerService],
})
export class PartnerModule {}
