import * as DataLoader from 'dataloader'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { Ad } from 'src/modules/ad/entity/ad.entity'
import { User } from 'src/modules/users/entity/user.entity'
import { Interaction } from '../entity/interaction.entity'
import { InteractionInput } from '../input/interaction.input'

@Injectable()
export class InteractionLoader {
  private loader: DataLoader<number, InteractionInput>

  constructor (
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Interaction)
    private readonly interactionRepo: Repository<Interaction>,
    @InjectRepository(Ad)
    private readonly adRepo: Repository<Ad>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
  ) {
    this.loader = new DataLoader<number, InteractionInput>(
      async (keys: number[]) => {
        const interactions = await this.interactionRepo.find({
          where: { id: In(keys) },
        })
        const interactioninMap = new Map(
          interactions.map(interaction => [interaction.id, interaction]),
        )

        const adIds = [
          ...new Set(interactions.map(interaction => interaction.adId)),
        ]
        const ads = await this.adRepo.find({
          where: { id: In(adIds) },
        })
        const adMap = new Map(ads.map(ad => [ad.id, ad]))

        const userIds = [
          ...new Set(interactions.map(interaction => interaction.userId)),
        ]
        const users = await this.userRepo.find({
          where: { id: In(userIds) },
        })
        const userMap = new Map(users.map(user => [user.id, user]))

        const campaigns = await this.campaignRepo.find({
          where: { id: In(adIds) },
        })
        const campaignMap = new Map(
          campaigns.map(campaign => [campaign.id, campaign]),
        )

        return keys.map(id => {
          const interaction = interactioninMap.get(id)
          if (!interaction)
            return new Error(`Interaction with ID ${id} not found`)

          const adOfCampaign = adMap.get(id)
          if (!adOfCampaign) return new Error(`Ad with ID ${id} not found`)

          const user = userMap.get(interaction.userId)
          const ad = adMap.get(interaction.adId)
          const campaign = campaignMap.get(adOfCampaign.campaignId)

          return {
            ...interaction,
            ad: { ...ad, campaign: { ...campaign } },
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
