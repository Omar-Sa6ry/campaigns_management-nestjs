import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { TicketService } from './ticket.service'
import { TicketInput } from './input/ticket.input'
import { TicketsInput } from './input/tickets.input'
import { CreateTicketDto } from './dtos/createTicket.dto'
import { Ticket } from './entity/ticket.entity'
import { TicketResponse, TicketsResponse } from './dtos/ticket.respone'
import { CreateTicket } from 'src/common/constant/messages.constant'
import { Role } from 'src/common/constant/enum.constant'
import { Auth } from 'src/common/decerator/auth.decerator'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { RedisService } from 'src/common/redis/redis.service'

@Resolver(() => Ticket)
export class TicketResolver {
  constructor (
    private readonly redisService: RedisService,
    private readonly ticketService: TicketService,
  ) {}

  @Mutation(() => TicketResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async createTicket (
    @CurrentUser() user: CurrentUserDto,
    @Args('createTicketDto') createTicketDto: CreateTicketDto,
    @Args('email') email: string,
  ): Promise<TicketResponse> {
    return {
      statusCode: 201,
      message: CreateTicket,
      data: await this.ticketService.createTicket(
        user.id,
        email,
        createTicketDto,
      ),
    }
  }

  @Query(() => TicketResponse, { nullable: true })
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getTicketById (
    @Args('id', { type: () => Int }) id: number,
  ): Promise<TicketResponse> {
    const TicketCacheKey = `ticket:${id}`
    const cachedTicket = await this.redisService.get(TicketCacheKey)
    if (cachedTicket instanceof TicketInput) {
      return { data: cachedTicket }
    }

    return { data: await this.ticketService.getById(id) }
  }

  @Query(() => TicketsResponse)
  @Auth(Role.USER, Role.ADMIN, Role.MANAGER)
  async getUserTickets (
    @CurrentUser() user: CurrentUserDto,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<TicketsResponse> {
    const TicketCacheKey = `ticket-user:${user.id}`
    const cachedTicket = await this.redisService.get(TicketCacheKey)
    if (cachedTicket instanceof TicketsInput) {
      return { ...cachedTicket }
    }

    return this.ticketService.getUserTickets(user.id, page, limit)
  }

  @Query(() => TicketsResponse)
  async getAllTickets (
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<TicketsResponse> {
    return this.ticketService.getAll(page, limit)
  }

  @Mutation(() => TicketResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async expireTicket (
    @Args('ticketId', { type: () => Int }) ticketId: number,
  ): Promise<TicketResponse> {
    return { data: await this.ticketService.expireTicket(ticketId) }
  }

  @Mutation(() => TicketResponse)
  async validateTicket (
    @Args('ticketId', { type: () => Int }) ticketId: number,
  ): Promise<TicketResponse> {
    return {
      message: `ticket is ${await this.ticketService.validateTicket(ticketId)}`,
      data: null,
    }
  }

  @Mutation(() => String)
  @Auth(Role.ADMIN, Role.MANAGER)
  async deleteTicket (
    @Args('ticketId', { type: () => Int }) ticketId: number,
  ): Promise<string> {
    return this.ticketService.delete(ticketId)
  }
}
