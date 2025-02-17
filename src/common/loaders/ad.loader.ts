import * as DataLoader from 'dataloader'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Ad } from 'src/modules/ad/entity/ad.entity'

@Injectable()
export class AdLoader {
  private loader: DataLoader<number, any>

  constructor (
    @InjectRepository(Ad)
    private AdRepo: Repository<Ad>,
  ) {
    this.loader = new DataLoader<number, any>(async (keys: number[]) => {
      const Ads = await this.AdRepo.findByIds(keys)
      const AdMap = new Map(Ads.map(Ad => [Ad.id, Ad]))
      return keys.map(id => AdMap.get(id))
    })
  }

  load (id: number): Promise<Ad> {
    return this.loader.load(id)
  }

  loadMany (ids: number[]): Promise<Ad[]> {
    return this.loader.loadMany(ids)
  }
}
