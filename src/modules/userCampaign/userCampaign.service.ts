import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { UserCampaignLoader } from './loader/userCampaign.loader'
import { UserService } from '../users/users.service'
import { Repository } from 'typeorm'
import { RedisService } from 'src/common/redis/redis.service'
import { UserCampaignInput } from '../campaign/inputs/userCampainInput'
import { Ad } from '../ad/entity/ad.entity'
import { Partner } from '../partner/entity/partner.entity'
import { CampaignService } from '../campaign/campaign.service'
import { User } from '../users/entity/user.entity'
import { Campaign } from '../campaign/entity/campaign.entity'
import { UserCampaignsInput } from './inputs/UserCampaign.input'
import { UserCampaign } from '../userCampaign/entity/userCampaign.entity'
import {
  CampaignNotFound,
  Limit,
  Page,
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
    private userCampaignLoader: UserCampaignLoader,
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
    page: number = Page,
    limit: number = Limit,
  ): Promise<UserCampaignsInput> {
    const user = await this.userService.findById(userId)
    if (!user) throw new BadRequestException(UserNotFound)

    const [data, total] = await this.userCampaignRepo.findAndCount({
      where: { userId },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['ads', 'partners', 'joinedCampaigns'],
      order: { joinAt: 'DESC' },
    })
    if (data.length == 0) throw new NotFoundException(UserCampaignsNotFound)

    const userCampaignIds = data.map(userCampaign => userCampaign.id)
    const userCampaigns = await this.userCampaignLoader.loadMany(
      userCampaignIds,
    )

    const items: UserCampaignInput[] = data.map((u, index) => {
      const userCampaign = userCampaigns[index]

      return userCampaign
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
    page: number = Page,
    limit: number = Limit,
  ): Promise<UserCampaignsInput> {
    const campaign = await this.campaignService.getCampainById(campaignId)
    if (!campaign) throw new BadRequestException(CampaignNotFound)

    const [data, total] = await this.userCampaignRepo.findAndCount({
      where: { campaignId },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['ads', 'partners', 'joinedCampaigns'],
      order: { joinAt: 'DESC' },
    })
    if (data.length === 0) throw new NotFoundException(UserCampaignsNotFound)

    const userCampaignIds = data.map(userCampaign => userCampaign.id)
    const userCampaigns = await this.userCampaignLoader.loadMany(
      userCampaignIds,
    )

    const items: UserCampaignInput[] = data.map((u, index) => {
      const userCampaign = userCampaigns[index]

      return userCampaign
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
