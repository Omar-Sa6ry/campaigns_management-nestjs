import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from 'src/modules/users/entity/user.entity'
import { RedisService } from 'src/common/redis/redis.service'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { PartnerService } from '../partner/partner.service'
import { PartnerStatus } from 'src/common/constant/enum.constant'
import { Ad } from '../ad/entity/ad.entity'
import { Partner } from '../partner/entity/partner.entity'
import { TicketService } from '../ticket/ticket.service'
import { NotificationService } from 'src/common/queues/notification/notification.service'
import { RequestInput } from './input/request.input'
import { RequestLoader } from './loader/request.loader'
import { RequestsInput } from './input/requests.input'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { PartnerRequest } from './entity/partnerRequest.entity'
import {
  CampaignNotFound,
  ExistedRequest,
  Limit,
  Page,
  RequestApprove,
  RequestNotFound,
  RequestRejected,
  RequestsNotFound,
  UserNotFound,
} from 'src/common/constant/messages.constant'

@Injectable()
export class PartnerRequestService {
  constructor (
    private partnerService: PartnerService,
    private readonly ticketService: TicketService,
    private readonly requestLoader: RequestLoader,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
    private readonly notificationService: NotificationService,
    @InjectRepository(PartnerRequest)
    private partnerRequestRepo: Repository<PartnerRequest>,
    @InjectRepository(Ad) private adRepo: Repository<Ad>,
    @InjectRepository(Partner) private partnerRepo: Repository<Partner>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Campaign) private campaignRepo: Repository<Campaign>,
  ) {}

  async create (userId: number, campaignId: number): Promise<RequestInput> {
    const query = this.partnerRequestRepo.manager.connection.createQueryRunner()
    await query.startTransaction()

    try {
      const existingRequest = await this.partnerRequestRepo.findOne({
        where: { userId, campaignId },
      })
      if (existingRequest) {
        throw new BadRequestException(ExistedRequest)
      }

      const user = await this.userRepo.findOne({ where: { id: userId } })
      if (!user) {
        throw new NotFoundException(UserNotFound)
      }

      const campaign = await this.campaignRepo.findOne({
        where: { id: campaignId },
      })

      if (!campaign) {
        throw new NotFoundException(CampaignNotFound)
      }

      const partner = await this.partnerService.create({
        campaignId,
        userId: user.id,
      })

      const request = this.partnerRequestRepo.create({
        userId,
        partnerId: partner.id,
        campaignId,
      })
      await this.partnerRequestRepo.save(request)

      const ads = await this.adRepo.find({ where: { campaignId: campaign.id } })
      const partners = await this.partnerRepo.find({
        where: { campaignId: campaign.id },
      })

      const result = {
        ...request,
        partner: { ...partner, campaign: { ...campaign, ads, partners } },
      }

      const relationCacheKey = `request:${request.id}`
      await this.redisService.set(relationCacheKey, result)

      await this.websocketGateway.broadcast('requestCreated', {
        requestId: request.id,
        request,
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

  async getById (requestId: number): Promise<RequestInput> {
    const request = await this.partnerRequestRepo.findOne({
      where: { id: requestId },
    })
    if (!request) throw new NotFoundException('Request not found')

    const user = await this.userRepo.findOne({
      where: { id: request.userId },
    })
    if (!user) {
      throw new NotFoundException(UserNotFound)
    }

    const campaign = await this.campaignRepo.findOne({
      where: { id: request.campaignId },
    })

    if (!campaign) {
      throw new NotFoundException(CampaignNotFound)
    }

    const partner = await this.partnerRepo.findOne({
      where: { campaignId: campaign.id },
    })

    const ads = await this.adRepo.find({ where: { campaignId: campaign.id } })
    const partners = await this.partnerRepo.find({
      where: { campaignId: campaign.id },
    })

    const result = {
      ...request,
      partner: { ...partner, campaign: { ...campaign, ads, partners } },
    }

    const relationCacheKey = `request:${request.id}`
    await this.redisService.set(relationCacheKey, result)

    await this.websocketGateway.broadcast('requestApprove', {
      requestId: request.id,
      request,
    })

    return result
  }

  async approvePartnership (
    requestId: number,
    email: string,
    expireAt: Date,
  ): Promise<RequestInput> {
    const query = this.partnerRequestRepo.manager.connection.createQueryRunner()
    await query.startTransaction()

    try {
      const request = await this.partnerRequestRepo.findOne({
        where: { id: requestId, status: PartnerStatus.PENDING },
      })
      if (!request) throw new NotFoundException('Request not found')

      request.status = PartnerStatus.APPROVES
      await this.partnerRequestRepo.save(request)

      const user = await this.userRepo.findOne({
        where: { id: request.userId },
      })
      if (!user) {
        throw new NotFoundException(UserNotFound)
      }

      const campaign = await this.campaignRepo.findOne({
        where: { id: request.campaignId },
      })

      if (!campaign) {
        throw new NotFoundException(CampaignNotFound)
      }

      const partner = await this.partnerRepo.findOne({
        where: { campaignId: campaign.id },
      })

      partner.status = PartnerStatus.APPROVES
      await this.partnerRepo.save(partner)

      const ads = await this.adRepo.find({ where: { campaignId: campaign.id } })
      const partners = await this.partnerRepo.find({
        where: { campaignId: campaign.id },
      })

      const result = {
        ...request,
        partner: { ...partner, campaign: { ...campaign, ads, partners } },
      }

      const relationCacheKey = `request:${request.id}`
      await this.redisService.set(relationCacheKey, result)

      await this.websocketGateway.broadcast('requestApprove', {
        requestId: request.id,
        request,
      })

      await this.ticketService.createTicket(user.id, email, {
        campaignId: campaign.id,
        expireAt,
      })

      await this.notificationService.sendPushNotification(
        user.fcmToken,
        campaign.name,
        RequestApprove,
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

  async rejectPartnership (requestId: number): Promise<RequestInput> {
    const query = this.partnerRequestRepo.manager.connection.createQueryRunner()
    await query.startTransaction()

    try {
      const request = await this.partnerRequestRepo.findOne({
        where: { id: requestId, status: PartnerStatus.PENDING },
      })
      if (!request) throw new NotFoundException('Request not found')

      request.status = PartnerStatus.REJECTED
      await this.partnerRequestRepo.save(request)

      const user = await this.userRepo.findOne({
        where: { id: request.userId },
      })
      if (!user) {
        throw new NotFoundException(UserNotFound)
      }

      const campaign = await this.campaignRepo.findOne({
        where: { id: request.campaignId },
      })

      if (!campaign) {
        throw new NotFoundException(CampaignNotFound)
      }

      const partner = await this.partnerRepo.findOne({
        where: { campaignId: campaign.id },
      })

      partner.status = PartnerStatus.REJECTED
      await this.partnerRepo.save(partner)

      const ads = await this.adRepo.find({ where: { campaignId: campaign.id } })
      const partners = await this.partnerRepo.find({
        where: { campaignId: campaign.id },
      })

      const result = {
        ...request,
        partner: { ...partner, campaign: { ...campaign, ads, partners } },
      }

      const relationCacheKey = `request:${request.id}`
      await this.redisService.set(relationCacheKey, result)

      await this.websocketGateway.broadcast('requestRejected', {
        requestId: request.id,
        request,
      })

      await this.notificationService.sendPushNotification(
        user.fcmToken,
        campaign.name,
        RequestRejected,
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

  async getrequests (
    status: PartnerStatus,
    page: number = Page,
    limit: number = Limit,
  ): Promise<RequestsInput> {
    const [data, total] = await this.partnerRequestRepo.findAndCount({
      where: { status },
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    })
    if (data.length === 0) throw new NotFoundException(RequestsNotFound)

    const requestIds = data.map(request => request.id)
    const requests = await this.requestLoader.loadMany(requestIds)

    const items: RequestInput[] = data.map((p, index) => {
      const request = requests[index]
      if (!request) throw new NotFoundException(RequestNotFound)

      return request
    })

    return {
      items,
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    }
  }
}
