import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { InjectRepository } from '@nestjs/typeorm'
import { UserService } from '../users/users.service'
import { Repository } from 'typeorm'
import { RedisService } from 'src/common/redis/redis.service'
import { UserCampaignInput } from '../campaign/inputs/userCampainInput'
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
import { CampaignService } from '../campaign/campaign.service'

@Injectable()
export class UserCampaignService {
  constructor (
    private readonly userService: UserService,
    private readonly campaignService: CampaignService,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
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
      id: userCampaign.id,
      joinAt: userCampaign.joinAt,
      user,
      campaign,
    }
  }

  async getUserCampainById (id: number): Promise<UserCampaign> {
    const campaign = await this.userCampaignRepo.findOne({
      where: { id },
      relations: ['user', 'campaign'],
    })
    if (!campaign) throw new NotFoundException(UserCampaignNotFound)

    const relationCacheKey = `user-campaign:${campaign.id}`
    await this.redisService.set(relationCacheKey, campaign)

    return campaign
  }

  async getUserCampaign (
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<UserCampaignsInput> {
    const user = await this.userService.findById(userId)
    if (!user) throw new BadRequestException(UserNotFound)

    const [campaigns, total] = await this.userCampaignRepo.findAndCount({
      where: { userId },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['ads', 'partners', 'joinedCampaigns'],
      order: { joinAt: 'DESC' },
    })
    if (!campaigns) throw new NotFoundException(UserCampaignsNotFound)

    const result = {
      items: campaigns,
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
    if (!campaigns) throw new NotFoundException(UserCampaignsNotFound)

    const relationCacheKey = `user-campaign-campaign${campaignId}:${page}:${limit}`
    await this.redisService.set(relationCacheKey, campaigns)

    return {
      items: campaigns,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
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
