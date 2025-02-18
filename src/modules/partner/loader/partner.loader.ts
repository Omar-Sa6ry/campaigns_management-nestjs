import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Partner } from 'src/modules/partner/entity/partner.entity'
import { Repository } from 'typeorm'
import * as DataLoader from 'dataloader'

@Injectable()
export class PartnerLoader {
  private loader: DataLoader<number, any>

  constructor (
    @InjectRepository(Partner)
    private PartnerRepo: Repository<Partner>,
  ) {
    this.loader = new DataLoader<number, any>(async (keys: number[]) => {
      const Partners = await this.PartnerRepo.findByIds(keys)
      const PartnerMap = new Map(Partners.map(Partner => [Partner.id, Partner]))
      return keys.map(id => PartnerMap.get(id))
    })
  }

  load (id: number): Promise<Partner> {
    return this.loader.load(id)
  }

  loadMany (ids: number[]): Promise<Partner[]> {
    return this.loader.loadMany(ids)
  }
}
