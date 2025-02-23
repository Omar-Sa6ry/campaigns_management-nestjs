import * as PDFDocument from 'pdfkit'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../users/entity/user.entity'
import { CampaignService } from '../campaign/campaign.service'
import { TicketInput } from './input/ticket.input'
import { ticketLoader } from './loader/ticket.loader'
import { RedisService } from 'src/common/redis/redis.service'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { TicketsInput } from './input/tickets.input'
import { TicketType } from 'src/common/constant/enum.constant'
import { Ticket } from './entity/ticket.entity'
import { CreateTicketDto } from './dtos/createTicket.dto'
import {
  CampaignNotFound,
  Limit,
  Page,
  TickestNotFound,
  TicketNotFound,
  UserNotFound,
} from 'src/common/constant/messages.constant'
import { SendEmailService } from 'src/common/queues/email/sendemail.service'
import { CreatePdfDto } from './dtos/GeneratePdf.dto'
import { Campaign } from '../campaign/entity/campaign.entity'
import * as fs from 'fs'
import * as path from 'path'
import { SendTicketService } from 'src/common/queues/ticket/sendticket.service'

@Injectable()
export class TicketService {
  constructor (
    private ticketLoader: ticketLoader,
    private readonly redisService: RedisService,
    private readonly campaignService: CampaignService,
    private readonly websocketGateway: WebSocketMessageGateway,
    private readonly sendTicketService: SendTicketService,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
  ) {}

  async createTicket (
    userId: number,
    email: string,
    createTicketDto: CreateTicketDto,
  ): Promise<TicketInput> {
    const query = this.ticketRepo.manager.connection.createQueryRunner()
    await query.startTransaction()

    try {
      const user = await this.userRepo.findOne({ where: { id: userId } })
      if (!user) throw new NotFoundException(UserNotFound)

      const campaign = await this.campaignRepo.findOne({
        where: { id: createTicketDto.campaignId },
      })
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

      const pdf = await this.generatePDF({
        id: ticket.id,
        email,
        ...campaign,
      })
      await this.sendTicketService.sendEmail(
        email,
        'Ticket',
        `This is your ticket`,
        pdf,
      )

      await query.commitTransaction()

      return result
    } catch (error) {
      await query.rollbackTransaction()
      throw error
    } finally {
      await query.release()
    }
  }

  async generatePDF (createPdfDto: CreatePdfDto): Promise<Buffer> {
    const { id, email, description, startDate, endDate, createdAt } =
      createPdfDto

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument()
        const buffers: Buffer[] = []

        doc.on('data', chunk => buffers.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(buffers)))
        doc.on('error', err => reject(err))

        doc.fontSize(14).text(`Ticket ID: ${id}`)
        doc.text(`Email: ${email}`)
        doc.text(`Start Date: ${startDate}`)
        doc.text(`End Date: ${endDate}`)
        doc.text(`Description: ${description}`)
        doc.text(`Created At: ${createdAt}`)
        doc.end()
      } catch (error) {
        reject(error)
      }
    })
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
    page: number = Page,
    limit: number = Limit,
  ): Promise<TicketsInput> {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException(UserNotFound)

    const [data, total] = await this.ticketRepo.findAndCount({
      where: { userId },
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    })

    if (data.length === 0) throw new NotFoundException(TickestNotFound)

    const ticketIds = data.map(ticket => ticket.id)
    const tickets = await this.ticketLoader.loadMany(ticketIds)

    const items: TicketInput[] = data.map((t, index) => {
      const ticket = tickets[index]
      if (!ticket) throw new NotFoundException(TicketNotFound)

      return ticket
    })

    const result = { items, total, page, totalPages: Math.ceil(total / limit) }
    const relationCacheKey = `ticket-userId:${userId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getAll (
    page: number = Page,
    limit: number = Limit,
  ): Promise<TicketsInput> {
    const [data, total] = await this.ticketRepo.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    })

    if (data.length === 0) throw new NotFoundException(TickestNotFound)

    const ticketIds = data.map(ticket => ticket.id)
    const tickets = await this.ticketLoader.loadMany(ticketIds)

    const items: TicketInput[] = data.map((t, index) => {
      const ticket = tickets[index]
      if (!ticket) throw new NotFoundException(TicketNotFound)

      return ticket
    })

    return {
      items,
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    }
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
