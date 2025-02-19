import * as DataLoader from 'dataloader'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { Ad } from 'src/modules/ad/entity/ad.entity'
import { User } from 'src/modules/users/entity/user.entity'
import { UserCampaignInput } from '../inputs/userCampainInput'
import { UserCampaign } from '../entity/userCampaign.entity'
import { Partner } from 'src/modules/partner/entity/partner.entity'

@Injectable()
export class UserCampaignLoader {
  private loader: DataLoader<number, UserCampaignInput>

  constructor (
    @InjectRepository(Ad) private readonly adRepo: Repository<Ad>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Partner)
    private readonly partnerRepo: Repository<Partner>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(UserCampaign)
    private readonly userCampaignRepo: Repository<UserCampaign>,
  ) {
    this.loader = new DataLoader<number, UserCampaignInput>(
      async (keys: number[]) => {
        const userCampaigns = await this.userCampaignRepo.find({
          where: { id: In(keys) },
        })

        const userIds = [...new Set(userCampaigns.map(uc => uc.userId))]
        const campaignIds = [...new Set(userCampaigns.map(uc => uc.campaignId))]

        const users = await this.userRepo.find({ where: { id: In(userIds) } })
        const campaigns = await this.campaignRepo.find({
          where: { id: In(campaignIds) },
        })
        const ads = await this.adRepo.find({
          where: { campaignId: In(campaignIds) },
        })
        const partners = await this.partnerRepo.find({
          where: { campaignId: In(campaignIds) },
        })

        const userMap = new Map(users.map(user => [user.id, user]))
        const campaignMap = new Map(
          campaigns.map(campaign => [campaign.id, campaign]),
        )
        const adsMap = new Map<number, Ad[]>(campaignIds.map(id => [id, []]))
        const partnersMap = new Map<number, Partner[]>(
          campaignIds.map(id => [id, []]),
        )

        ads.forEach(ad => adsMap.get(ad.campaignId)?.push(ad))
        partners.forEach(partner =>
          partnersMap.get(partner.campaignId)?.push(partner),
        )

        return keys.map(id => {
          const userCampaign = userCampaigns.find(uc => uc.id === id)
          if (!userCampaign)
            return new Error(`UserCampaign with ID ${id} not found`)

          const user = userMap.get(userCampaign.userId)
          const campaign = campaignMap.get(userCampaign.campaignId)
          const campaignAds = adsMap.get(userCampaign.campaignId)
          const campaignPartners = partnersMap.get(userCampaign.campaignId)

          return {
            ...userCampaign,
            user,
            campaign: {
              ...campaign,
              ads: campaignAds,
              partners: campaignPartners,
            },
          }
        })
      },
    )
  }

  load (id: number): Promise<UserCampaignInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<UserCampaignInput[]> {
    const results = await this.loader.loadMany(ids)
    return results.filter(
      (result): result is UserCampaignInput => !(result instanceof Error),
    )
  }
}
