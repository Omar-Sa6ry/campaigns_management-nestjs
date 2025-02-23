import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { Repository, In } from 'typeorm'
import { CampaignInput } from '../inputs/campain.input'
import { Ad } from 'src/modules/ad/entity/ad.entity'
import { Partner } from 'src/modules/partner/entity/partner.entity'
import {
  AdNotFound,
  PartnerNotFound,
} from 'src/common/constant/messages.constant'

@Injectable()
export class CampaignLoader {
  private loader: DataLoader<number, CampaignInput>

  constructor (
    @InjectRepository(Ad) private adRepo: Repository<Ad>,
    @InjectRepository(Partner) private partnerRepo: Repository<Partner>,
    @InjectRepository(Campaign) private campaignRepo: Repository<Campaign>,
  ) {
    this.loader = new DataLoader<number, CampaignInput>(
      async (keys: number[]) => {
        const campaigns = await this.campaignRepo.find({
          where: { id: In(keys) },
        })
        const ads = await this.adRepo.find({ where: { campaignId: In(keys) } })
        const partners = await this.partnerRepo.find({
          where: { campaignId: In(keys) },
        })

        const adMap = new Map<number, Ad[]>(ads.map(ad => [ad.campaignId, []]))
        const partnerMap = new Map(
          partners.map(partner => [partner.campaignId, partner]),
        )

        return keys.map(key => {
          const campaign = campaigns.find(c => c.id === key)
          if (!campaign)
            throw new NotFoundException(`Campaign with ID ${key} not found`)

          const ad = adMap.get(campaign.id)
          if (!ad) throw new NotFoundException(AdNotFound)

          const partner = partnerMap.get(campaign.id)
          if (!partner) throw new NotFoundException(PartnerNotFound)

          return { ...campaign, ad, partner }
        })
      },
    )
  }

  load (id: number): Promise<CampaignInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<CampaignInput[]> {
    const results = await this.loader.loadMany(ids)

    return results.filter(
      result => !(result instanceof Error),
    ) as CampaignInput[]
  }
}
