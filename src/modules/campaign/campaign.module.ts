import { Module } from '@nestjs/common'
import { CampaignResolver } from './campaign.resolver'
import { CampaignService } from './campaign.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Campaign } from './entity/campaign.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Campaign])],
  providers: [CampaignResolver, CampaignService],
})
export class CampaignModule {}
