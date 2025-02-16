import { Injectable, NotFoundException } from '@nestjs/common'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { InjectRepository } from '@nestjs/typeorm'
import { Campaign } from './entity/campaign.entity'
import { DataSource, Repository } from 'typeorm'
import { CreateCampaignCDto } from './dtos/CreateCampaign.dto'
import { RedisService } from 'src/common/redis/redis.service'
import { CampaignCDto } from './dtos/Campaign.dto'
import { CampaignsInput } from './inputs/Campaigns.input'
import {
  CampaignNotFound,
  CampaignsNotFound,
  DeleteCamapaign,
} from 'src/common/constant/messages.constant'

@Injectable()
export class CampaignService {
  constructor (
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
    @InjectRepository(Campaign)
    private campaignRepo: Repository<Campaign>,
  ) {}

  async create (createCampaign: CreateCampaignCDto): Promise<Campaign> {
    const query = this.campaignRepo.manager.connection.createQueryRunner()
    await query.startTransaction()

    try {
      const tomorrow: Date = createCampaign.startDate
      tomorrow.setDate(tomorrow.getDate() + 1)

      const campaign = this.campaignRepo.create({
        ...createCampaign,
        startDate: tomorrow,
      })
      await this.campaignRepo.save(campaign)

      const relationCacheKey = `campaign:${campaign.id}`
      await this.redisService.set(relationCacheKey, campaign)

      await this.websocketGateway.broadcast('campaignCreated', {
        campaignId: campaign.id,
        campaign,
      })
      await query.commitTransaction()

      return campaign
    } catch (error) {
      await query.rollbackTransaction()
      throw error
    } finally {
      await query.release()
    }
  }

  async getCampainById (id: number): Promise<Campaign> {
    const campaign = await this.campaignRepo.findOne({
      where: { id },
      relations: ['ads', 'partners', 'joinedCampaigns'],
    })
    if (!campaign) throw new NotFoundException(CampaignNotFound)

    const relationCacheKey = `campaign:${campaign.id}`
    await this.redisService.set(relationCacheKey, campaign)

    return campaign
  }

  async getCampaign (
    CampaignDto: CampaignCDto,
    page: number = 1,
    limit: number = 10,
  ): Promise<CampaignsInput> {
    const [campaigns, total] = await this.campaignRepo.findAndCount({
      where: { ...CampaignDto },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['ads', 'partners', 'joinedCampaigns'],
      order: { createdAt: 'DESC' },
    })
    if (campaigns.length == 0) throw new NotFoundException(CampaignsNotFound)

    return {
      items: campaigns,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  async listCampaign (
    page: number = 1,
    limit: number = 10,
  ): Promise<CampaignsInput> {
    const [campaigns, total] = await this.campaignRepo.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    })
    if (campaigns.length == 0) throw new NotFoundException(CampaignsNotFound)

    return {
      items: campaigns,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  async updateCampaign (
    id: number,
    updateCampaignDto: CampaignCDto,
  ): Promise<Campaign> {
    const campaign = await this.getCampainById(id)
    if (!campaign) throw new NotFoundException(CampaignNotFound)

    await this.campaignRepo.update(id, updateCampaignDto)
    await this.websocketGateway.broadcast('campaignUpdated', {
      campaignId: id,
    })

    return this.getCampainById(id)
  }

  async deleteCampaign (id: number): Promise<string> {
    const campaign = await this.getCampainById(id)
    if (!campaign) throw new NotFoundException(CampaignNotFound)

    await this.campaignRepo.remove(campaign)

    await this.websocketGateway.broadcast('campaignDeleted', {
      campaignId: id,
    })

    return DeleteCamapaign
  }
}
