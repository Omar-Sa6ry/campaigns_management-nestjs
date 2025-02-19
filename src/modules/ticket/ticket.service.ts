import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../users/entity/user.entity'
import { CampaignService } from '../campaign/campaign.service'
import { TicketInput } from './input/ticket.input'
import { RedisService } from 'src/common/redis/redis.service'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { TicketsInput } from './input/tickets.input'
import { CampaignLoader } from '../campaign/loader/campaign.loader'
import { TicketType } from 'src/common/constant/enum.constant'
import { UserLoader } from '../users/loader/user.loader'
import { Ticket } from './entity/ticket.entity'
import { CreateTicketDto } from './dtos/createTicket.dto'
import {
  CampaignNotFound,
  TickestNotFound,
  TicketNotFound,
  UserNotFound,
} from 'src/common/constant/messages.constant'

@Injectable()
export class TicketService {
  constructor (
    private userLoader: UserLoader,
    private campaignLoader: CampaignLoader,
    private readonly redisService: RedisService,
    private readonly campaignService: CampaignService,
    private readonly websocketGateway: WebSocketMessageGateway,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createTicket (
    userId: number,
    createTicketDto: CreateTicketDto,
  ): Promise<TicketInput> {
    const query = this.ticketRepo.manager.connection.createQueryRunner()
    await query.startTransaction()

    try {
      const user = await this.userRepo.findOne({ where: { id: userId } })
      if (!user) throw new NotFoundException(UserNotFound)

      const campaign = await this.campaignService.getCampainById(
        createTicketDto.campaignId,
      )
      if (!campaign) throw new NotFoundException(CampaignNotFound)

      const ticket = this.ticketRepo.create({
        ...createTicketDto,
        userId,
      })
      await this.ticketRepo.save(ticket)

      const result = { ...ticket, user, campaign }
      const relationCacheKey = `ticket:${ticket.id}`
      await this.redisService.set(relationCacheKey, result)

      await this.websocketGateway.broadcast('ticketCreated', {
        ticketId: ticket.id,
        ticket,
      })

      await query.commitTransaction()

      return result
    } catch (error) {
      await query.rollbackTransaction()
      throw error
    } finally {
      await query.release()
    }
  }

  async getById (ticketId: number): Promise<TicketInput> {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } })
    if (!ticket) throw new NotFoundException(TicketNotFound)

    const user = await this.userRepo.findOne({ where: { id: ticket.userId } })
    if (!user) throw new NotFoundException(UserNotFound)

    const campaign = await this.campaignService.getCampainById(
      ticket.campaignId,
    )
    if (!campaign) throw new NotFoundException(CampaignNotFound)

    const result = { ...ticket, user, campaign }
    const relationCacheKey = `ticket:${ticket.id}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getUserTickets (
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<TicketsInput> {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException(UserNotFound)

    const [tickets, total] = await this.ticketRepo.findAndCount({
      where: { userId },
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    })

    if (tickets.length === 0) throw new NotFoundException(TickestNotFound)

    const campaignIds = tickets.map(ticket => ticket.campaignId)
    const campaigns = await this.campaignLoader.loadMany(campaignIds)

    const items: TicketInput[] = tickets.map((ticket, index) => {
      const campaign = campaigns[index]
      if (!campaign) throw new NotFoundException(CampaignNotFound)

      return {
        ...ticket,
        user,
        campaign,
      }
    })

    const result = { items, total, page, totalPages: Math.ceil(total / limit) }
    const relationCacheKey = `ticket-userId:${userId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getAll (page: number = 1, limit: number = 10): Promise<TicketsInput> {
    const [tickets, total] = await this.ticketRepo.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    })

    if (tickets.length === 0) throw new NotFoundException(TickestNotFound)

    const campaignIds = tickets.map(ticket => ticket.campaignId)
    const campaigns = await this.campaignLoader.loadMany(campaignIds)

    const userIds = tickets.map(ticket => ticket.userId)
    const users = await this.userLoader.loadMany(userIds)

    const items: TicketInput[] = tickets.map((ticket, index) => {
      const campaign = campaigns[index]
      if (!campaign) throw new NotFoundException(CampaignNotFound)

      const user = users[index]
      if (!user) throw new NotFoundException(UserNotFound)

      return {
        ...ticket,
        user,
        campaign,
      }
    })

    return { items, total, page, totalPages: Math.ceil(total / limit) }
  }

  async expireTicket (ticketId: number): Promise<TicketInput> {
    const query = this.ticketRepo.manager.connection.createQueryRunner()
    await query.startTransaction()

    try {
      const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } })
      if (!ticket) throw new NotFoundException(TicketNotFound)

      ticket.status = TicketType.EXPIRED
      await this.ticketRepo.save(ticket)

      const user = await this.userRepo.findOne({ where: { id: ticket.userId } })
      if (!user) throw new NotFoundException(UserNotFound)

      const campaign = await this.campaignService.getCampainById(
        ticket.campaignId,
      )
      if (!campaign) throw new NotFoundException(CampaignNotFound)

      const result = { ...ticket, user, campaign }
      const relationCacheKey = `ticket:${ticket.id}`
      await this.redisService.set(relationCacheKey, result)

      await this.websocketGateway.broadcast('ticketExpire', {
        ticketId: ticket.id,
        ticket,
      })

      await query.commitTransaction()

      return result
    } catch (error) {
      await query.rollbackTransaction()
      throw error
    } finally {
      await query.release()
    }
  }

  async delete (ticketId: number): Promise<string> {
    const query = this.ticketRepo.manager.connection.createQueryRunner()
    await query.startTransaction()

    try {
      const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } })
      if (!ticket) throw new NotFoundException(TicketNotFound)

      await this.ticketRepo.remove(ticket)

      await this.websocketGateway.broadcast('ticketDelete', {
        ticketId: ticket.id,
      })

      await query.commitTransaction()

      return
    } catch (error) {
      await query.rollbackTransaction()
      throw error
    } finally {
      await query.release()
    }
  }

  async validateTicket (ticketId: number): Promise<boolean> {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } })
    if (!ticket) throw new NotFoundException(TicketNotFound)

    return ticket.status === TicketType.VAILD && new Date() < ticket.expireAt
  }
}
