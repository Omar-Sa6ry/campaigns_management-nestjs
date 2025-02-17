import * as DataLoader from 'dataloader'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { Repository } from 'typeorm'

@Injectable()
export class CampaignLoader {
  private loader: DataLoader<number, any>

  constructor (
    @InjectRepository(Campaign)
    private campaignRepo: Repository<Campaign>,
  ) {
    this.loader = new DataLoader<number, any>(async (keys: number[]) => {
      const campaigns = await this.campaignRepo.findByIds(keys)
      const campaignMap = new Map(
        campaigns.map(campaign => [campaign.id, campaign]),
      )
      return keys.map(id => campaignMap.get(id))
    })
  }

  load (id: number): Promise<Campaign> {
    return this.loader.load(id)
  }

  loadMany (ids: number[]): Promise<Campaign[]> {
    return this.loader.loadMany(ids)
  }
}
