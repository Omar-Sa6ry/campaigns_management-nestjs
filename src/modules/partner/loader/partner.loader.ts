import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { Partner } from 'src/modules/partner/entity/partner.entity'
import { Ad } from 'src/modules/ad/entity/ad.entity'
import { PartnerInput } from '../input/partner.input'

@Injectable()
export class PartnerLoader {
  private loader: DataLoader<number, PartnerInput>

  constructor (
    @InjectRepository(Partner)
    private readonly partnerRepo: Repository<Partner>,
    @InjectRepository(Ad)
    private readonly adRepo: Repository<Ad>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
  ) {
    this.loader = new DataLoader<number, PartnerInput>(
      async (keys: number[]) => {
        const partners = await this.partnerRepo.find({
          where: { id: In(keys) },
        })
        const partnerMap = new Map(
          partners.map(partner => [partner.id, partner]),
        )

        const campaignIds = [
          ...new Set(partners.map(partner => partner.campaignId)),
        ]

        const campaigns = await this.campaignRepo.find({
          where: { id: In(campaignIds) },
        })
        const campaignMap = new Map(
          campaigns.map(campaign => [campaign.id, campaign]),
        )

        const ads = await this.adRepo.find({
          where: { campaignId: In(campaignIds) },
        })
        const partnersByCampaign = await this.partnerRepo.find({
          where: { campaignId: In(campaignIds) },
        })

        const adsMap = new Map<number, Ad[]>(campaignIds.map(id => [id, []]))
        const partnersMap = new Map<number, Partner[]>(
          campaignIds.map(id => [id, []]),
        )

        ads.forEach(ad => adsMap.get(ad.campaignId)?.push(ad))
        partnersByCampaign.forEach(partner =>
          partnersMap.get(partner.campaignId)?.push(partner),
        )

        return keys.map(id => {
          const partner = partnerMap.get(id)
          if (!partner)
            throw new NotFoundException(`Partner with ID ${id} not found`)

          const campaign = campaignMap.get(partner.campaignId) || null
          const ads = adsMap.get(partner.campaignId) || []
          const partners = partnersMap.get(partner.campaignId) || []

          return {
            ...partner,
            campaign: { ...campaign, ads, partners },
          }
        })
      },
    )
  }

  load (id: number): Promise<PartnerInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<PartnerInput[]> {
    const results = await this.loader.loadMany(ids)
    return results.filter(
      (result): result is PartnerInput => !(result instanceof Error),
    )
  }
}
