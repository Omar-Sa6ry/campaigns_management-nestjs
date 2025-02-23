import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In, Not } from 'typeorm'
import { Ad } from 'src/modules/ad/entity/ad.entity'
import { Partner } from 'src/modules/partner/entity/partner.entity'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import {
  AdNotFound,
  AdsNotFound,
  CampaignNotFound,
  PartnersNotFound,
} from 'src/common/constant/messages.constant'
import { AdInput } from '../dtos/adInput.dto'

@Injectable()
export class AdLoader {
  private loader: DataLoader<number, AdInput>

  constructor (
    @InjectRepository(Ad) private readonly adRepo: Repository<Ad>,
    @InjectRepository(Partner)
    private readonly partnerRepo: Repository<Partner>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
  ) {
    this.loader = new DataLoader<number, AdInput>(async (keys: number[]) => {
      const ads = await this.adRepo.find({ where: { id: In(keys) } })
      if (!ads.length) throw new NotFoundException(AdsNotFound)

      const campaignIds = [...new Set(ads.map(ad => ad.campaignId))]
      const campaigns = await this.campaignRepo.find({
        where: { id: In(campaignIds) },
      })
      if (!campaigns.length) throw new NotFoundException(CampaignNotFound)

      const adsFromCampaign = await this.adRepo.find({
        where: { campaignId: In(campaignIds) },
      })
      const partnersFromCampaign = await this.partnerRepo.find({
        where: { campaignId: In(campaignIds) },
      })

      const campaignMap = new Map(
        campaigns.map(campaign => [campaign.id, campaign]),
      )
      const adsMap = new Map<number, Ad[]>(campaignIds.map(id => [id, []]))
      const partnersMap = new Map<number, Partner[]>(
        campaignIds.map(id => [id, []]),
      )

      adsFromCampaign.forEach(ad => adsMap.get(ad.campaignId)?.push(ad))
      partnersFromCampaign.forEach(partner =>
        partnersMap.get(partner.campaignId)?.push(partner),
      )

      return keys.map(key => {
        const ad = ads.find(a => a.id === key)
        if (!ad) throw new NotFoundException(AdNotFound)

        const campaign = campaignMap.get(ad.campaignId)
        if (!campaign) throw new NotFoundException(CampaignNotFound)

        return {
          ...ad,
          campaign: {
            ...campaign,
            ads: adsMap.get(ad.campaignId) || [],
            partners: partnersMap.get(ad.campaignId) || [],
          },
        }
      })
    })
  }

  load (id: number): Promise<AdInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<AdInput[]> {
    const results = await this.loader.loadMany(ids)
    return results.filter(
      (result): result is AdInput => !(result instanceof Error),
    )
  }
}
