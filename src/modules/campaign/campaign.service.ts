import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { InjectRepository } from '@nestjs/typeorm'
import { Campaign } from './entity/campaign.entity'
import { Repository } from 'typeorm'
import { CreateCampaignCDto } from './dtos/CreateCampaign.dto'
import { CampaignInput } from './inputs/campain.input'
import { Ad } from '../ad/entity/ad.entity'
import { Cron, CronExpression } from '@nestjs/schedule'
import { NotificationService } from 'src/common/queues/notification/notification.service'
import { User } from '../users/entity/user.entity'
import { RedisService } from 'src/common/redis/redis.service'
import { Partner } from '../partner/entity/partner.entity'
import { CampaignDto } from './dtos/Campaign.dto'
import { CampaignsInput } from './inputs/Campaigns.input'
import { CampaignLoader } from './loader/campaign.loader'
import {
  CampaignNotFound,
  CampaignsNotFound,
  DeleteCamapaign,
  Limit,
  Page,
} from 'src/common/constant/messages.constant'
// import { UserCampaignService } from '../userCampaign/userCampaign.service'

@Injectable()
export class CampaignService {
  constructor (
    private campaignLoader: CampaignLoader,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
    private readonly notificationService: NotificationService,
    // private readonly userCampaignService: UserCampaignService,
    @InjectRepository(Ad) private adRepo: Repository<Ad>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Campaign) private campaignRepo: Repository<Campaign>,
    @InjectRepository(Partner) private partnerRepo: Repository<Partner>,
  ) {}

  // tomorrow's campaigns
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduleCampaignReminders () {
    await this.notifyUsersBeforeCampaignStarts()
  }

  //  starting today
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduleCampaignStartNotifications () {
    await this.notifyUsersAtCampaignStart()
  }

  async create (
    createCampaign: CreateCampaignCDto,
    userId: number,
  ): Promise<CampaignInput> {
    const query = this.campaignRepo.manager.connection.createQueryRunner()
    await query.startTransaction()

    try {
      const tomorrow: Date = createCampaign.startDate
      tomorrow.setDate(tomorrow.getDate() + 1)

      const campaign = this.campaignRepo.create({
        ...createCampaign,
        userId,
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

    const partner = await this.partnerRepo.find({
      where: { campaignId: campaign.id },
    })
    const ads = await this.adRepo.find({ where: { campaignId: campaign.id } })

    const result = { ...campaign, ads, partner }

    const relationCacheKey = `campaign:${campaign.id}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getCampaign (
    CampaignDto: CampaignDto,
    page: number = Page,
    limit: number = Limit,
  ): Promise<CampaignsInput> {
    const [data, total] = await this.campaignRepo.findAndCount({
      where: { ...CampaignDto },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['ads', 'partners', 'joinedCampaigns'],
      order: { createdAt: 'DESC' },
    })
    if (data.length == 0) throw new NotFoundException(CampaignsNotFound)

    const campaignIds = data.map(campaign => campaign.id)
    const campaigns = await this.campaignLoader.loadMany(campaignIds)

    const items: CampaignInput[] = data.map((c, index) => {
      const campaign = campaigns[index]
      return campaign
    })

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  async listCampaign (
    page: number = Page,
    limit: number = Limit,
  ): Promise<CampaignsInput> {
    const [data, total] = await this.campaignRepo.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    })
    if (data.length == 0) throw new NotFoundException(CampaignsNotFound)

    const campaignIds = data.map(campaign => campaign.id)
    const campaigns = await this.campaignLoader.loadMany(campaignIds)

    const items: CampaignInput[] = data.map((c, index) => {
      const campaign = campaigns[index]
      return campaign
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

  async notifyUsersBeforeCampaignStarts (): Promise<void> {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const campaigns = await this.campaignRepo.find({
      where: { startDate: tomorrow },
    })

    for (const campaign of campaigns) {
      const partners = await this.partnerRepo.find({
        where: { campaignId: campaign.id },
      })

      for (const partner of partners) {
        const user = await this.userRepo.findOne({ where: { id: partner.id } })
        await this.notificationService.sendPushNotification(
          user.fcmToken,
          'campaign start!',
          `Campaign "${campaign.name}" starts in 24 hours!`,
        )
      }
    }
  }

  async notifyUsersAtCampaignStart (): Promise<void> {
    const today = new Date()

    const campaigns = await this.campaignRepo.find({
      where: { startDate: today },
    })

    for (const campaign of campaigns) {
      const partners = await this.partnerRepo.find({
        where: { campaignId: campaign.id },
      })

      for (const partner of partners) {
        const user = await this.userRepo.findOne({ where: { id: partner.id } })
        await this.notificationService.sendPushNotification(
          user.fcmToken,
          'campaign has started!',
          `Campaign "${campaign.name}" has started!`,
        )
      }
    }
  }
}
