import { Injectable, NotFoundException } from '@nestjs/common'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { InjectRepository } from '@nestjs/typeorm'
import { Campaign } from './entity/campaign.entity'
import { Repository } from 'typeorm'
import { CreateCampaignCDto } from './dtos/CreateCampaign.dto'
import { CampaignInput } from './inputs/campain.input'
import { Ad } from '../ad/entity/ad.entity'
import { AdLoader } from 'src/common/loaders/ad.loader'
import { RedisService } from 'src/common/redis/redis.service'
import { CampaignDto } from './dtos/Campaign.dto'
import { CampaignsInput } from './inputs/Campaigns.input'
import {
  AdNotFound,
  CampaignNotFound,
  CampaignsNotFound,
  DeleteCamapaign,
} from 'src/common/constant/messages.constant'

@Injectable()
export class CampaignService {
  constructor (
    private adLoader: AdLoader,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
    @InjectRepository(Ad)
    private adRepo: Repository<Ad>,
    @InjectRepository(Campaign)
    private campaignRepo: Repository<Campaign>,
  ) {}

  async create (createCampaign: CreateCampaignCDto): Promise<CampaignInput> {
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

  async getCampainById (id: number): Promise<CampaignInput> {
    const campaign = await this.campaignRepo.findOne({
      where: { id },
      relations: ['ads', 'partners', 'joinedCampaigns'],
    })
    if (!campaign) throw new NotFoundException(CampaignNotFound)

    const ads = await this.adRepo.find({ where: { campaignId: campaign.id } })
    const result = { ...campaign, ads: ads }

    const relationCacheKey = `campaign:${campaign.id}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getCampaign (
    CampaignDto: CampaignDto,
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

    const adIds = campaigns.map(ad => ad.id)
    const ads = await this.adLoader.loadMany(adIds)

    const items: CampaignInput[] = campaigns.map((campaign, index) => {
      const ad = ads[index]
      if (!ad) throw new NotFoundException(AdNotFound)

      return {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        status: campaign.status,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        createdAt: campaign.createdAt,
        ads: [
          {
            id: ad.id,
            type: ad.type,
            status: ad.status,
            url: ad.url,
            content: ad.content,
            title: ad.title,
            createdAt: ad.createdAt,

            campaign,
          },
        ],
      }
    })

    return {
      items,
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

    const adIds = campaigns.map(ad => ad.id)
    const ads = await this.adLoader.loadMany(adIds)

    const items: CampaignInput[] = campaigns.map((campaign, index) => {
      const ad = ads[index]
      if (!ad) throw new NotFoundException(AdNotFound)

      return {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        status: campaign.status,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        createdAt: campaign.createdAt,
        ads: [
          {
            id: ad.id,
            type: ad.type,
            status: ad.status,
            url: ad.url,
            content: ad.content,
            title: ad.title,
            createdAt: ad.createdAt,

            campaign,
          },
        ],
      }
    })

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  async updateCampaign (
    id: number,
    updateCampaignDto: CampaignDto,
  ): Promise<CampaignInput> {
    const campaign = await this.getCampainById(id)
    if (!campaign) throw new NotFoundException(CampaignNotFound)

    await this.campaignRepo.update(id, updateCampaignDto)
    await this.websocketGateway.broadcast('campaignUpdated', {
      campaignId: id,
    })

    return this.getCampainById(id)
  }

  async deleteCampaign (id: number): Promise<string> {
    const campaign = await this.campaignRepo.findOne({ where: { id } })
    if (!campaign) throw new NotFoundException(CampaignNotFound)

    await this.campaignRepo.remove(campaign)

    await this.websocketGateway.broadcast('campaignDeleted', {
      campaignId: id,
    })

    return DeleteCamapaign
  }
}
