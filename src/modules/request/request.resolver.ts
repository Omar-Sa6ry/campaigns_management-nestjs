import { Resolver, Query, Mutation, Args } from '@nestjs/graphql'
import { RequestInput } from './input/request.input'
import { PartnerStatus, Role } from 'src/common/constant/enum.constant'
import { PartnerRequestService } from './request.service'
import { RedisService } from 'src/common/redis/redis.service'
import { Auth } from 'src/common/decerator/auth.decerator'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { RequestResponse, RequestsResponse } from './dto/request.response'
import {
  CreateRequest,
  RequestApprove,
  RequestRejected,
} from 'src/common/constant/messages.constant'

@Resolver(() => Request)
export class PartnerRequestResolver {
  constructor (
    private readonly redisService: RedisService,
    private readonly partnerRequestService: PartnerRequestService,
  ) {}

  @Mutation(() => RequestResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async createRequest (
    @CurrentUser() user: CurrentUserDto,
    @Args('campaignId') campaignId: number,
  ): Promise<RequestResponse> {
    return {
      statusCode: 201,
      message: CreateRequest,
      data: await this.partnerRequestService.create(user.id, campaignId),
    }
  }

  @Mutation(() => RequestResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getRequestById (
    @Args('requestId') requestId: number,
  ): Promise<RequestResponse> {
    const requestCacheKey = `request:${requestId}`
    const cachedRequest = await this.redisService.get(requestCacheKey)
    if (cachedRequest instanceof RequestInput) {
      return { data: cachedRequest }
    }

    return { data: await this.partnerRequestService.getById(requestId) }
  }

  @Mutation(() => RequestResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async approvePartnership (
    @Args('requestId') requestId: number,
    @Args('expireAt') expireAt: Date,
    @Args('email') email: string,
  ): Promise<RequestResponse> {
    return {
      message: RequestApprove,
      data: await this.partnerRequestService.approvePartnership(
        requestId,
        email,
        expireAt,
      ),
    }
  }

  @Mutation(() => RequestResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async rejectPartnership (
    @Args('requestId') requestId: number,
  ): Promise<RequestResponse> {
    return {
      message: RequestRejected,
      data: await this.partnerRequestService.rejectPartnership(requestId),
    }
  }

  @Query(() => RequestsResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async getRequests (
    @Args('status', { type: () => PartnerStatus }) status: PartnerStatus,
    @Args('page', { type: () => Number, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Number, defaultValue: 10 }) limit: number,
  ): Promise<RequestsResponse> {
    return this.partnerRequestService.getrequests(status, page, limit)
  }
}
