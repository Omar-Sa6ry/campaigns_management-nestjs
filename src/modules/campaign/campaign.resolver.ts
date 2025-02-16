import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { CampaignService } from './campaign.service'
import { Campaign } from './entity/campaign.entity'
import { RedisService } from 'src/common/redis/redis.service'
import { CreateCampaignCDto } from './dtos/CreateCampaign.dto'
import { CampaignCDto } from './dtos/Campaign.dto'
import { Auth } from 'src/common/decerator/auth.decerator'
import { Role } from 'src/common/constant/enum.constant'
import { CampaignResponse, CampaignsResponse } from './dtos/CampaignResponse'
import {
  CreateCampaign,
  UpdatedCampaign,
} from 'src/common/constant/messages.constant'

@Resolver(() => Campaign)
export class CampaignResolver {
  constructor (
    private readonly redisService: RedisService,
    private readonly campaignService: CampaignService,
  ) {}

  @Mutation(() => CampaignResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async createCampaign (
    @Args('createCampaignDto') createCampaignDto: CreateCampaignCDto,
  ): Promise<CampaignResponse> {
    const data = await this.campaignService.create(createCampaignDto)

    return {
      statusCode: 201,
      message: CreateCampaign,
      data,
    }
  }

  @Query(() => CampaignResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getCampaignById (
    @Args('id', { type: () => Int }) id: number,
  ): Promise<CampaignResponse> {
    const campaignCacheKey = `campaign:${id}`
    const cachedCampaign = await this.redisService.get(campaignCacheKey)
    if (cachedCampaign instanceof Campaign) {
      return { data: cachedCampaign }
    }

    const data = await this.campaignService.getCampainById(id)
    return { data }
  }

  @Query(() => CampaignsResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getCampaigns (
    @Args('campaignDto') campaignDto: CampaignCDto,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<CampaignsResponse> {
    const data = await this.campaignService.getCampaign(
      campaignDto,
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

  @Query(() => CampaignsResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getListCampaigns (
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<CampaignsResponse> {
    const data = await this.campaignService.listCampaign(page, limit)

    return {
      items: data.items,
      pagination: {
        currentPage: data.page,
        totalPages: data.totalPages,
        totalItems: data.total,
      },
    }
  }

  @Mutation(() => CampaignResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async UpdateCampaign (
    @Args('id', { type: () => Int }) id: number,
    @Args('updateCampaignDto') updateCampaignDto: CampaignCDto,
  ): Promise<CampaignResponse> {
    return {
      message: UpdatedCampaign,
      data: await this.campaignService.updateCampaign(id, updateCampaignDto),
    }
  }

  @Mutation(() => CampaignResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async deleteCampaign (
    @Args('id', { type: () => Int }) id: number,
  ): Promise<CampaignResponse> {
    return {
      data: null,
      message: await this.campaignService.deleteCampaign(id),
    }
  }
}
