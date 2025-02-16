import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { UserCampaignsInput } from './inputs/UserCampaign.input'
import { Auth } from 'src/common/decerator/auth.decerator'
import { Role } from 'src/common/constant/enum.constant'
import { UserJoin } from 'src/common/constant/messages.constant'
import { RedisService } from 'src/common/redis/redis.service'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { UserCampaign } from './entity/userCampaign.entity'
import { UserCampaignService } from './userCampaign.service'
import {
  UserCampaignResponse,
  UserCampaignsResponse,
} from '../userCampaign/dtos/UserCampaignResponse'

@Resolver(() => UserCampaign)
export class UserCampaignResolver {
  constructor (
    private readonly redisService: RedisService,
    private readonly userCampaignService: UserCampaignService,
  ) {}

  @Mutation(() => UserCampaignResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async joinCampaign (
    @Args('userId', { type: () => Int }) userId: number,
    @Args('campaignId', { type: () => Int }) campaignId: number,
  ): Promise<UserCampaignResponse> {
    return {
      statusCode: 201,
      message: UserJoin,
      data: await this.userCampaignService.joinCampaign(userId, campaignId),
    }
  }

  @Query(() => UserCampaignResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async getCampaignById (
    @Args('id', { type: () => Int }) id: number,
  ): Promise<UserCampaignResponse> {
    const campaignCacheKey = `user-campaign:${id}`
    const cachedCampaign = await this.redisService.get(campaignCacheKey)
    if (cachedCampaign instanceof UserCampaign) {
      return { data: cachedCampaign }
    }

    return {
      data: await this.userCampaignService.getUserCampainById(id),
    }
  }

  @Query(() => UserCampaignsResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async getUserCampaigns (
    @Args('userId', { type: () => Int }) userId: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<UserCampaignsResponse> {
    const campaignCacheKey = `user-campaign-user:${userId}:${page}:${limit}`
    const cachedCampaign = await this.redisService.get(campaignCacheKey)
    if (cachedCampaign instanceof UserCampaignsInput) {
      return { ...cachedCampaign }
    }

    const data = await this.userCampaignService.getUserCampaign(
      userId,
      page,
      limit,
    )
    return {
      items: data.items,
      pagination: {
        currentPage: data.page,
        totalPages: data.totalPages,
        totalItems: data.total,
      },
    }
  }

  @Query(() => UserCampaignsResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async getCampaignsFromUser (
    @Args('campaignId', { type: () => Int }) campaignId: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<UserCampaignsResponse> {
    const campaignCacheKey = `user-campaign-campaign:${campaignId}:${page}:${limit}`
    const cachedCampaign = await this.redisService.get(campaignCacheKey)
    if (cachedCampaign instanceof UserCampaignsInput) {
      return { ...cachedCampaign }
    }

    const data = await this.userCampaignService.getCampaignFromUser(
      campaignId,
      page,
      limit,
    )
    return {
      items: data.items,
      pagination: {
        currentPage: data.page,
        totalPages: data.totalPages,
        totalItems: data.total,
      },
    }
  }

  @Mutation(() => String)
  @Auth(Role.USER)
  async deleteUserFromCampaign (
    @CurrentUser() user: CurrentUserDto,
  ): Promise<string> {
    return await this.userCampaignService.deleteUserFromCampaign(user.id)
  }

  @Mutation(() => String)
  @Auth(Role.ADMIN, Role.MANAGER)
  async removeUserFromCampaign (
    @Args('userId', { type: () => Int }) userId: number,
    @Args('campaignId', { type: () => Int }) campaignId: number,
  ): Promise<string> {
    return await this.userCampaignService.removeUserFromCampaign(
      userId,
      campaignId,
    )
  }
}
