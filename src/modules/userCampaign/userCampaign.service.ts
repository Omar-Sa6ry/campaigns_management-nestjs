import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { UserService } from '../users/users.service'
import { Repository } from 'typeorm'
import { RedisService } from 'src/common/redis/redis.service'
import { UserCampaignInput } from '../campaign/inputs/userCampainInput'
import { Ad } from '../ad/entity/ad.entity'
import { Partner } from '../partner/entity/partner.entity'
import { PartnerLoader } from 'src/modules/partner/loader/partner.loader'
import { CampaignService } from '../campaign/campaign.service'
import { User } from '../users/entity/user.entity'
import { Campaign } from '../campaign/entity/campaign.entity'
import { AdLoader } from 'src/modules/ad/loader/ad.loader'
import { CampaignLoader } from 'src/modules/campaign/loader/campaign.loader'
import { UserLoader } from 'src/modules/users/loader/user.loader'
import { UserCampaignsInput } from './inputs/UserCampaign.input'
import { UserCampaign } from '../userCampaign/entity/userCampaign.entity'
import {
  CampaignNotFound,
  RemoveUserFromCampaign,
  UserCampaignIsExisted,
  UserCampaignNotFound,
  UserCampaignsNotFound,
  UserNotFound,
  YouRemoveCampaign,
} from 'src/common/constant/messages.constant'

@Injectable()
export class UserCampaignService {
  constructor (
    private adLoader: AdLoader,
    private userLoader: UserLoader,
    private partnerLoader: PartnerLoader,
    private campaignLoader: CampaignLoader,
    private readonly userService: UserService,
    private readonly campaignService: CampaignService,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Ad) private adRepo: Repository<Ad>,
    @InjectRepository(Partner) private partnerRepo: Repository<Partner>,
    @InjectRepository(Campaign) private campaignRepo: Repository<Campaign>,
    @InjectRepository(UserCampaign)
    private userCampaignRepo: Repository<UserCampaign>,
  ) {}

  async joinCampaign (
    userId: number,
    campaignId: number,
  ): Promise<UserCampaignInput> {
    const user = await this.userService.findById(userId)
    if (!user) throw new BadRequestException(UserNotFound)

    const campaign = await this.campaignService.getCampainById(campaignId)
    if (!campaign) throw new BadRequestException(CampaignNotFound)

    const ifExisted = await this.userCampaignRepo.findOne({
      where: { userId, campaignId },
    })
    if (ifExisted) throw new BadRequestException(UserCampaignIsExisted)

    const userCampaign = this.userCampaignRepo.create({
      userId,
      campaignId,
    })

    await this.userCampaignRepo.save(userCampaign)

    const relationCacheKey = `user-campaign:${userCampaign.id}`
    await this.redisService.set(relationCacheKey, userCampaign)

    await this.websocketGateway.broadcast('campaignCreated', {
      userCampaignId: userCampaign.id,
      userCampaign,
      userId,
    })

    return {
      ...userCampaign,
      user,
      campaign,
    }
  }

  async getUserCampainById (id: number): Promise<UserCampaignInput> {
    const userCampaign = await this.userCampaignRepo.findOne({
      where: { id },
      relations: ['user', 'campaign'],
    })
    if (!userCampaign) throw new NotFoundException(UserCampaignNotFound)

    const user = await this.userRepo.findOne({
      where: { id: userCampaign.userId },
    })
    if (!user) throw new NotFoundException(UserNotFound)

    const campaign = await this.campaignRepo.findOne({
      where: { id: userCampaign.campaignId },
    })
    if (!campaign) throw new BadRequestException(CampaignNotFound)

    const partners = await this.partnerRepo.find({
      where: { campaignId: campaign.id },
    })
    const ads = await this.adRepo.find({ where: { campaignId: campaign.id } })

    const result = {
      ...userCampaign,
      user,
      campaign: { ...campaign, ads, partners },
    }
    const relationCacheKey = `user-campaign:${userCampaign.id}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getUserCampaign (
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<UserCampaignsInput> {
    const user = await this.userService.findById(userId)
    if (!user) throw new BadRequestException(UserNotFound)

    const [userCampaigns, total] = await this.userCampaignRepo.findAndCount({
      where: { userId },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['ads', 'partners', 'joinedCampaigns'],
      order: { joinAt: 'DESC' },
    })
    if (userCampaigns.length == 0)
      throw new NotFoundException(UserCampaignsNotFound)

    const campaignIds = userCampaigns.map(
      userCampaign => userCampaign.campaignId,
    )
    const campaigns = await this.campaignLoader.loadMany(campaignIds)

    // To get ads for all campaign in ad
    const adIds = campaigns.map(ad => ad.id)
    const ads = await this.adLoader.loadMany(adIds)

    const partnerIds = campaigns.map(campaign => campaign.id)
    const partners = await this.partnerLoader.loadMany(partnerIds)

    const items = userCampaigns.map((userCampaign, index) => {
      const campaign = campaigns[index]

      return {
        ...userCampaign,
        user: { ...user },
        campaign: {
          ...campaign,
          ads: ads.filter(ad => ad.campaignId === campaign.id),
          partners: partners.filter(
            partner => partner.campaignId === campaign.id,
          ),
        },
      }
    })

    const result = {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }

    const relationCacheKey = `user-campaign-user${userId}:${page}:${limit}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getCampaignFromUser (
    campaignId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<UserCampaignsInput> {
    const campaign = await this.campaignService.getCampainById(campaignId)
    if (!campaign) throw new BadRequestException(CampaignNotFound)

    const [campaigns, total] = await this.userCampaignRepo.findAndCount({
      where: { campaignId },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['ads', 'partners', 'joinedCampaigns'],
      order: { joinAt: 'DESC' },
    })
    if (campaigns.length === 0)
      throw new NotFoundException(UserCampaignsNotFound)

    const userIds = campaigns.map(ad => ad.userId)
    const users = await this.userLoader.loadMany(userIds)

    const adIds = campaigns.map(ad => ad.campaignId)
    const ads = await this.adLoader.loadMany(adIds)

    const partnerIds = campaigns.map(campaign => campaign.id)
    const partners = await this.partnerLoader.loadMany(partnerIds)

    const items = campaigns.map((userCampaign, index) => {
      const user = users[index]
      if (!user) throw new NotFoundException(UserNotFound)

      return {
        ...userCampaign,
        user: { ...user },
        campaign: {
          ...campaign,
          ads: ads.filter(ad => ad.campaignId === campaign.id),
          partners: partners.filter(
            partner => partner.campaignId === campaign.id,
          ),
        },
      }
    })

    const result = {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }

    const relationCacheKey = `user-campaign-campaign${campaignId}:${page}:${limit}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async deleteUserFromCampaign (userId: number): Promise<string> {
    const user = await this.userService.findById(userId)
    if (!user) throw new BadRequestException(UserNotFound)

    await this.userCampaignRepo.delete(userId)
    return YouRemoveCampaign
  }

  async removeUserFromCampaign (
    userId: number,
    campaignId: number,
  ): Promise<string> {
    const user = await this.userService.findById(userId)
    if (!user) throw new BadRequestException(UserNotFound)

    const campaign = await this.campaignService.getCampainById(campaignId)
    if (!campaign) throw new BadRequestException(CampaignNotFound)

    await this.userCampaignRepo.delete({ userId, campaignId })
    return RemoveUserFromCampaign
  }
}
