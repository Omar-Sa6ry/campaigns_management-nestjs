import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { User } from 'src/modules/users/entity/user.entity'
import { Partner } from 'src/modules/partner/entity/partner.entity'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { Ad } from 'src/modules/ad/entity/ad.entity'
import { PartnerRequest } from '../entity/partnerRequest.entity'
import { RequestInput } from '../input/request.input'

@Injectable()
export class RequestLoader {
  private loader: DataLoader<number, RequestInput>

  constructor (
    @InjectRepository(PartnerRequest)
    private readonly partnerRequestRepo: Repository<PartnerRequest>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Partner)
    private readonly partnerRepo: Repository<Partner>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(Ad) private readonly adRepo: Repository<Ad>,
  ) {
    this.loader = new DataLoader<number, RequestInput>(
      async (keys: number[]) => {
        const requests = await this.partnerRequestRepo.find({
          where: { id: In(keys) },
        })

        const partnerIds = requests.map(r => r.partnerId)
        const campaignIds = requests.map(r => r.campaignId)

        const partners = await this.partnerRepo.find({
          where: { id: In(partnerIds) },
        })
        const campaigns = await this.campaignRepo.find({
          where: { id: In(campaignIds) },
        })
        const ads = await this.adRepo.find({
          where: { campaignId: In(campaignIds) },
        })
        const partnersOfCampaigns = await this.partnerRepo.find({
          where: { campaignId: In(campaignIds) },
        })

        const partnerMap = new Map(partners.map(p => [p.id, p]))
        const campaignMap = new Map(
          campaigns.map(c => [c.id, { ...c, ads: [], partners: [] }]),
        )

        ads.forEach(ad => {
          if (campaignMap.has(ad.campaignId)) {
            campaignMap.get(ad.campaignId).ads.push(ad)
          }
        })

        partnersOfCampaigns.forEach(partner => {
          if (campaignMap.has(partner.campaignId)) {
            campaignMap.get(partner.campaignId).partners.push(partner)
          }
        })

        return keys.map(key => {
          const request = requests.find(r => r.id === key)
          if (!request)
            throw new NotFoundException(`Request with ID ${key} not found`)

          const partner: Partner = partnerMap.get(request.partnerId)
          const campaign: Campaign = campaignMap.get(request.campaignId)

          return {
            ...request,
            partner: {
              ...partner,
              campaign,
            },
          }
        })
      },
    )
  }

  load (id: number): Promise<RequestInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<RequestInput[]> {
    const results = await this.loader.loadMany(ids)
    return results.filter(
      (result): result is RequestInput => !(result instanceof Error),
    )
  }
}
