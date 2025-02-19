import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { PartnerService } from './partner.service'
import { PartnerInput } from './input/partner.input'
import { PartnerDto } from './dtos/partner.dto'
import { PartnersInput } from './input/partners.input'
import { CreatePartnerDto } from './dtos/createPartner.dto'
import { PartnerResponse, PartnersResponse } from './dtos/partner.respone'
import { Partner } from './entity/partner.entity'
import { CampaignResponse } from '../campaign/dtos/CampaignResponse'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { Auth } from 'src/common/decerator/auth.decerator'
import { Role } from 'src/common/constant/enum.constant'
import { RedisService } from 'src/common/redis/redis.service'
import { CreatePartner } from 'src/common/constant/messages.constant'
import { CampaignInput } from '../campaign/inputs/campain.input'
import { AdsResponse } from '../ad/dtos/adResponse.dto'

@Resolver(() => Partner)
export class PartnerResolver {
  constructor (
    private readonly redisService: RedisService,
    private readonly partnerService: PartnerService,
  ) {}

  @Mutation(() => PartnerResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async createPartner (
    @Args('createPartner') createPartner: CreatePartnerDto,
  ): Promise<PartnerResponse> {
    return {
      statusCode: 201,
      message: CreatePartner,
      data: await this.partnerService.create(createPartner),
    }
  }

  @Query(() => PartnerResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getPartnerById (
    @Args('id', { type: () => Int }) id: number,
  ): Promise<PartnerResponse> {
    const partnerCacheKey = `partner:${id}`
    const cachedPartner = await this.redisService.get(partnerCacheKey)
    if (cachedPartner instanceof PartnerInput) {
      return { data: cachedPartner }
    }

    return { data: await this.partnerService.getPartnerById(id) }
  }

  @Query(() => PartnersResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getPartners (
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
  ): Promise<PartnersResponse> {
    return this.partnerService.getPartners(limit, page)
  }

  @Query(() => PartnersResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getPartnersWithData (
    @Args('partnerDto') partnerDto: PartnerDto,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
  ): Promise<PartnersResponse> {
    return this.partnerService.getPartnersWithData(partnerDto, limit, page)
  }

  @Query(() => AdsResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async getAdsFromPartner (
    @Args('partnerId') partnerId: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
  ): Promise<AdsResponse> {
    return this.partnerService.getAdsFromPartner(partnerId, limit, page)
  }

  @Query(() => CampaignResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getCampaignFromPartner (
    @Args('campaignId', { type: () => Int }) campaignId: number,
  ): Promise<CampaignResponse> {
    const partnerCacheKey = `partner-campaign:${campaignId}`
    const cachedPartner = await this.redisService.get(partnerCacheKey)
    if (cachedPartner instanceof CampaignInput) {
      return { data: cachedPartner }
    }

    return {
      data: await this.partnerService.getCampaignFromPartner(campaignId),
    }
  }

  @Query(() => PartnersResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getPartnersFromUserAdmin (
    @Args('userId', { type: () => Int }) userId: number,
  ): Promise<PartnersResponse> {
    const partnerCacheKey = `partner-user:${userId}`
    const cachedPartner = await this.redisService.get(partnerCacheKey)
    if (cachedPartner instanceof PartnersInput) {
      return { ...cachedPartner }
    }

    return await this.partnerService.getPartnersFromUser(userId)
  }

  @Query(() => PartnersResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getPartnersFromUser (
    @CurrentUser() user: CurrentUserDto,
  ): Promise<PartnersResponse> {
    const partnerCacheKey = `partner-user:${user.id}`
    const cachedPartner = await this.redisService.get(partnerCacheKey)
    if (cachedPartner instanceof PartnersInput) {
      return { ...cachedPartner }
    }

    return await this.partnerService.getPartnersFromUser(user.id)
  }

  @Mutation(() => PartnerResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async updatePartner (
    @Args('id', { type: () => Int }) id: number,
    @Args('updateData') updateData: PartnerDto,
  ): Promise<PartnerResponse> {
    return { data: await this.partnerService.updatePartner(id, updateData) }
  }

  @Mutation(() => PartnerResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async deletePartner (
    @Args('id', { type: () => Int }) id: number,
  ): Promise<PartnerResponse> {
    return { message: await this.partnerService.deletePartner(id), data: null }
  }
}
