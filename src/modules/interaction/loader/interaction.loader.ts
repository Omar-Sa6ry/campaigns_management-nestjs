import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { Ad } from 'src/modules/ad/entity/ad.entity'
import { User } from 'src/modules/users/entity/user.entity'
import { Interaction } from '../entity/interaction.entity'
import { InteractionInput } from '../input/interaction.input'
import { Partner } from 'src/modules/partner/entity/partner.entity'

@Injectable()
export class InteractionLoader {
  private loader: DataLoader<number, InteractionInput>

  constructor (
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Interaction)
    private readonly interactionRepo: Repository<Interaction>,
    @InjectRepository(Ad) private readonly adRepo: Repository<Ad>,
    @InjectRepository(Partner)
    private readonly partnerRepo: Repository<Partner>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
  ) {
    this.loader = new DataLoader<number, InteractionInput>(
      async (keys: number[]) => {
        const interactions = await this.interactionRepo.find({
          where: { id: In(keys) },
        })
        const interactionMap = new Map(interactions.map(i => [i.id, i]))

        const adIds = [...new Set(interactions.map(i => i.adId))]
        const ads = await this.adRepo.find({ where: { id: In(adIds) } })
        const adMap = new Map(ads.map(ad => [ad.id, ad]))

        const userIds = [...new Set(interactions.map(i => i.userId))]
        const users = await this.userRepo.find({ where: { id: In(userIds) } })
        const userMap = new Map(users.map(user => [user.id, user]))

        const campaignIds = [...new Set(ads.map(ad => ad.campaignId))]
        const campaigns = await this.campaignRepo.find({
          where: { id: In(campaignIds) },
        })
        const campaignMap = new Map(
          campaigns.map(campaign => [campaign.id, campaign]),
        )

        const adsFromCampaign = await this.adRepo.find({
          where: { campaignId: In(campaignIds) },
        })
        const partnersFromCampaign = await this.partnerRepo.find({
          where: { campaignId: In(campaignIds) },
        })

        const adsMap = new Map<number, Ad[]>(campaignIds.map(id => [id, []]))
        const partnersMap = new Map<number, Partner[]>(
          campaignIds.map(id => [id, []]),
        )

        adsFromCampaign.forEach(ad => adsMap.get(ad.campaignId)?.push(ad))
        partnersFromCampaign.forEach(partner =>
          partnersMap.get(partner.campaignId)?.push(partner),
        )

        return keys.map(id => {
          const interaction = interactionMap.get(id)
          if (!interaction)
            throw new NotFoundException(`Interaction with ID ${id} not found`)

          const ad = adMap.get(interaction.adId)
          const campaign = campaignMap.get(ad.campaignId)
          const user = userMap.get(interaction.userId)

          return {
            ...interaction,
            ads: {
              ...ad,
              campaign: {
                ...campaign,
                ads: adsMap.get(ad.campaignId) || [],
                partners: partnersMap.get(ad.campaignId) || [],
              },
            },
            user,
          }
        })
      },
    )
  }

  load (id: number): Promise<InteractionInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<InteractionInput[]> {
    const results = await this.loader.loadMany(ids)
    return results.filter(
      (result): result is InteractionInput => !(result instanceof Error),
    )
  }
}
