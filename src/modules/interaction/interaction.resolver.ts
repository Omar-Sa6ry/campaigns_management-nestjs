import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { InteractionService } from './interaction.service'
import { RedisService } from 'src/common/redis/redis.service'
import { InteractionInput } from './input/interaction.input'
import { InteractionsInput } from './input/interactions.input'
import { MostInteractedDto } from './input/mostInteraction.dto'
import { CreateInteractionDto } from './dtos/createInteraction.dto'
import { Interaction } from './entity/interaction.entity'
import { Role } from 'src/common/constant/enum.constant'
import { Auth } from 'src/common/decerator/auth.decerator'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import {
  InteractionResponse,
  InteractionsResponse,
} from './dtos/interaction.response'

@Resolver(() => Interaction)
export class InteractionResolver {
  constructor (
    private readonly redisService: RedisService,
    private readonly interactionService: InteractionService,
  ) {}

  @Mutation(() => InteractionResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async createInteraction (
    @CurrentUser() user: CurrentUserDto,
    @Args('data') data: CreateInteractionDto,
  ): Promise<InteractionResponse> {
    return { data: await this.interactionService.create(user.id, data) }
  }

  @Query(() => InteractionResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getInteractionById (
    @Args('id', { type: () => Int }) id: number,
  ): Promise<InteractionResponse> {
    const InteractionCacheKey = `interaction:${id}`
    const cachedInteraction = await this.redisService.get(InteractionCacheKey)
    if (cachedInteraction instanceof InteractionInput) {
      return { data: cachedInteraction }
    }

    return { data: await this.interactionService.getById(id) }
  }

  @Query(() => InteractionsResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async getInteractions (
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<InteractionsResponse> {
    return this.interactionService.get(page, limit)
  }

  @Query(() => InteractionsResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async getUserInteractionsByAdmin (
    @Args('userId', { type: () => Int }) userId: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<InteractionsResponse> {
    const InteractionCacheKey = `interaction-user:${userId}`
    const cachedInteraction = await this.redisService.get(InteractionCacheKey)
    if (cachedInteraction instanceof InteractionsInput) {
      return { ...cachedInteraction }
    }

    return this.interactionService.getUserInteractions(userId, page, limit)
  }

  @Query(() => InteractionsResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getUserInteractions (
    @CurrentUser() user: CurrentUserDto,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<InteractionsResponse> {
    const InteractionCacheKey = `interaction-user:${user.email}`
    const cachedInteraction = await this.redisService.get(InteractionCacheKey)
    if (cachedInteraction instanceof InteractionsInput) {
      return { ...cachedInteraction }
    }

    return this.interactionService.getUserInteractions(user.id, page, limit)
  }

  @Query(() => Int)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async countAdInteractions (
    @Args('adId', { type: () => Int }) adId: number,
  ): Promise<number> {
    return this.interactionService.countAdInteractions(adId)
  }

  @Query(() => [MostInteractedDto])
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getMostInteractedAds (
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<MostInteractedDto[]> {
    return this.interactionService.getMostInteractedAds(limit)
  }
}
