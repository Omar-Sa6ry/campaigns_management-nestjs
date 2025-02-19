import { Resolver, Query, Mutation, Args } from '@nestjs/graphql'
import { AdService } from './ad.service'
import { AdInput, AdsInput } from './dtos/adInput.dto'
import { CreateADto } from './dtos/createAd.dto'
import { AdDto } from './dtos/Ad.dto'
import { Ad } from './entity/ad.entity'
import { CreateImagDto } from 'src/common/upload/dtos/createImage.dto'
import { AdResponse, AdsResponse } from './dtos/adResponse.dto'
import { CreateAd } from 'src/common/constant/messages.constant'
import { Role } from 'src/common/constant/enum.constant'
import { Auth } from 'src/common/decerator/auth.decerator'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { CampaignResponse } from '../campaign/dtos/CampaignResponse'
import { RedisService } from 'src/common/redis/redis.service'

@Resolver(() => Ad)
export class AdResolver {
  constructor (
    private readonly adService: AdService,
    private readonly redisService: RedisService,
  ) {}

  @Mutation(() => AdResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async createAd (
    @Args('createAd') createAd: CreateADto,
    @Args('CreateMediaDo', { nullable: true }) createMediaDo?: CreateImagDto,
  ): Promise<AdResponse> {
    return {
      message: CreateAd,
      statusCode: 201,
      data: await this.adService.create(createAd, createMediaDo),
    }
  }

  @Query(() => AdResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getAd (@Args('id') id: number): Promise<AdResponse> {
    const adCacheKey = `ad:${id}`
    const cachedAd = await this.redisService.get(adCacheKey)
    if (cachedAd instanceof AdInput) {
      return { data: cachedAd }
    }

    return { data: await this.adService.getAdById(id) }
  }

  @Query(() => AdsResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getAds (
    @Args('adDto') adDto: AdDto,
    @Args('page', { type: () => Number, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Number, defaultValue: 10 }) limit: number,
  ): Promise<AdsResponse> {
    return await this.adService.getAds(adDto, page, limit)
  }

  @Query(() => AdsResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async ListAds (
    @Args('page', { type: () => Number, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Number, defaultValue: 10 }) limit: number,
  ): Promise<AdsResponse> {
    return await this.adService.listAds(page, limit)
  }

  @Query(() => AdsResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async getAdsFromUserId (
    @Args('userId') userId: number,
    @Args('page', { type: () => Number, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Number, defaultValue: 10 }) limit: number,
  ): Promise<AdsResponse> {
    const adCacheKey = `ad-user:${userId}`
    const cachedAd = await this.redisService.get(adCacheKey)
    if (cachedAd instanceof AdsInput) {
      return { ...cachedAd }
    }

    return await this.adService.getAdsFromUser(userId, page, limit)
  }

  @Query(() => AdsResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async getAdsFromCampaign (
    @Args('campaignId') campaignId: number,
    @Args('page', { type: () => Number, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Number, defaultValue: 10 }) limit: number,
  ): Promise<AdsResponse> {
    return await this.adService.getAdsFromCampaign(campaignId, page, limit)
  }

  @Query(() => AdsResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getAdsFromUser (
    @CurrentUser() user: CurrentUserDto,
    @Args('page', { type: () => Number, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Number, defaultValue: 10 }) limit: number,
  ): Promise<AdsResponse> {
    return await this.adService.getAdsFromUser(user.id, page, limit)
  }

  @Query(() => CampaignResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getCampaignFromAd (
    @Args('campaignId') campaignId: number,
  ): Promise<CampaignResponse> {
    return { data: await this.adService.getCampaignFromAd(campaignId) }
  }

  @Mutation(() => AdResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async updateAd (
    @Args('id') id: number,
    @Args('updateAdDto') updateAdDto: AdDto,
  ): Promise<AdResponse> {
    return { data: await this.adService.updateAd(id, updateAdDto) }
  }

  @Mutation(() => String)
  @Auth(Role.ADMIN, Role.MANAGER)
  async deleteAd (@Args('id') id: number): Promise<string> {
    return await this.adService.deleteAd(id)
  }
}
