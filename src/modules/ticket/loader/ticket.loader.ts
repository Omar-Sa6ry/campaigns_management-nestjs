import * as DataLoader from 'dataloader'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { TicketInput } from '../input/ticket.input'
import { Ticket } from '../entity/ticket.entity'
import { User } from 'src/modules/users/entity/user.entity'
import { Repository, In } from 'typeorm'
import { Ad } from 'src/modules/ad/entity/ad.entity'
import { Partner } from 'src/modules/partner/entity/partner.entity'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import {
  CampaignNotFound,
  TickestNotFound,
  TicketNotFound,
  UserNotFound,
} from 'src/common/constant/messages.constant'

@Injectable()
export class ticketLoader {
  private loader: DataLoader<number, TicketInput>

  constructor (
    @InjectRepository(Ad) private readonly adRepo: Repository<Ad>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Ticket) private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(Partner)
    private readonly partnerRepo: Repository<Partner>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
  ) {
    this.loader = new DataLoader<number, TicketInput>(
      async (keys: number[]) => {
        const tickets = await this.ticketRepo.find({ where: { id: In(keys) } })
        if (tickets.length === 0) throw new NotFoundException(TickestNotFound)

        const userIds = [...new Set(tickets.map(ad => ad.userId))]
        const users = await this.userRepo.find({
          where: { id: In(userIds) },
        })
        if (users.length === 0) throw new NotFoundException(UserNotFound)

        const usersMap = new Map(users.map(user => [user.id, user]))

        const campaignIds = [...new Set(tickets.map(ad => ad.campaignId))]
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
          const ticket = tickets.find(a => a.id === key)
          if (!ticket) throw new NotFoundException(TicketNotFound)

          const campaign = campaignMap.get(ticket.campaignId)
          if (!campaign) throw new NotFoundException(CampaignNotFound)

          const user = usersMap.get(ticket.userId)
          if (!user) throw new NotFoundException(UserNotFound)

          return {
            ...ticket,
            user,
            campaign: {
              ...campaign,
              ads: adsMap.get(ticket.campaignId) || [],
              partners: partnersMap.get(ticket.campaignId) || [],
            },
          }
        })
      },
    )
  }

  load (id: number): Promise<TicketInput> {
    return this.loader.load(id)
  }

  async loadMany (ids: number[]): Promise<TicketInput[]> {
    const results = await this.loader.loadMany(ids)
    return results.filter(
      (result): result is TicketInput => !(result instanceof Error),
    )
  }
}
