import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Interaction } from './entity/interaction.entity'
import { InteractionInput } from './input/interaction.input'
import { InteractionsInput } from './input/interactions.input'
import { RedisService } from 'src/common/redis/redis.service'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { InterActionType } from 'src/common/constant/enum.constant'
import { InteractionLoader } from './loader/interaction.loader'
import { Ad } from '../ad/entity/ad.entity'
import { Campaign } from '../campaign/entity/campaign.entity'
import { MostInteractedDto } from './input/mostInteraction.dto'
import { User } from '../users/entity/user.entity'
import { CreateInteractionDto } from './dtos/createInteraction.dto'
import {
  AdNotFound,
  CampaignNotFound,
  InteractionNotFound,
  InteractionsNotFound,
  Limit,
  Page,
  UserNotFound,
} from 'src/common/constant/messages.constant'
import { Partner } from '../partner/entity/partner.entity'

@Injectable()
export class InteractionService {
  constructor (
    private readonly interactionLoader: InteractionLoader,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
    @InjectRepository(Ad) private readonly adRepo: Repository<Ad>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Partner)
    private readonly partnerRepo: Repository<Partner>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(Interaction)
    private readonly interactionRepo: Repository<Interaction>,
  ) {}

  async create (
    userId: number,
    interactionDto: CreateInteractionDto,
  ): Promise<InteractionInput> {
    const query = this.interactionRepo.manager.connection.createQueryRunner()
    await query.startTransaction()

    try {
      const exist = await this.interactionRepo.findOne({
        where: { adId: interactionDto.adId, userId, type: interactionDto.type },
      })
      if (exist) {
        return null
      }

      const ads = await this.adRepo.findOne({
        where: { id: interactionDto.adId },
      })
      if (!ads) throw new NotFoundException(AdNotFound)

      const user = await this.userRepo.findOne({
        where: { id: userId },
      })
      if (!user) throw new NotFoundException(UserNotFound)

      const interaction = await this.interactionRepo.create({
        userId,
        ...interactionDto,
      })
      await this.interactionRepo.save(interaction)

      const result = { ...interaction, user, ads }
      const relationCacheKey = `interaction:${interaction.id}`
      await this.redisService.set(relationCacheKey, result)

      await this.websocketGateway.broadcast('interactionCreated', {
        interactionId: interaction.id,
        interaction,
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

  async getById (id: number): Promise<InteractionInput> {
    const interaction = await this.interactionRepo.findOne({
      where: { id },
    })

    if (!interaction) throw new NotFoundException(InteractionNotFound)

    const ad = await this.adRepo.findOne({ where: { id: interaction.adId } })
    const user = await this.userRepo.findOne({
      where: { id: interaction.userId },
    })

    const campaign = await this.campaignRepo.findOne({
      where: { id: ad.campaignId },
    })
    if (!campaign) throw new NotFoundException(CampaignNotFound)

    const ads = await this.adRepo.find({ where: { campaignId: campaign.id } })
    const partners = await this.partnerRepo.find({
      where: { campaignId: campaign.id },
    })

    return {
      ...interaction,
      ads: { ...ad, campaign: { ...campaign, ads, partners } },
      user,
    }
  }

  async get (
    page: number = Page,
    limit: number = Limit,
  ): Promise<InteractionsInput> {
    const [data, total] = await this.interactionRepo.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    })

    if (data.length === 0) throw new NotFoundException(InteractionsNotFound)

    const interactionIds = data.map(interaction => interaction.id)
    const interactions = await this.interactionLoader.loadMany(interactionIds)

    const items: InteractionInput[] = data.map((i, index) => {
      const interaction = interactions[index]

      return interaction
    })

    return {
      items,
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    }
  }

  async getUserInteractions (
    userId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<InteractionsInput> {
    const [data, total] = await this.interactionRepo.findAndCount({
      where: { userId },
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    })

    if (data.length === 0) throw new NotFoundException(InteractionsNotFound)

    const interactionIds = data.map(interaction => interaction.id)
    const interactions = await this.interactionLoader.loadMany(interactionIds)

    const items: InteractionInput[] = data.map((i, index) => {
      const interaction = interactions[index]

      return interaction
    })

    const result = {
      items,
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    }
    const relationCacheKey = `interaction-user:${userId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async countAdClick (adId: number): Promise<number> {
    const ad = await this.adRepo.findOne({ where: { id: adId } })
    if (!ad) throw new BadRequestException(AdNotFound)

    return (
      (await this.interactionRepo.count({
        where: { adId, type: InterActionType.CLICK },
      })) || 0
    )
  }

  async countAdIViews (adId: number): Promise<number> {
    const ad = await this.adRepo.findOne({ where: { id: adId } })
    if (!ad) throw new BadRequestException(AdNotFound)

    const result = (await this.interactionRepo.count({ where: { adId } })) || 0
    return result
  }

  async getMostInteractedAds (limit: number = 10): Promise<MostInteractedDto[]> {
    // Sql Query
    // SELECT
    //     adId,
    //     COUNT(id) AS count
     // FROM  interaction
    // GROUP BY interaction.adId
    // ORDER BY count DESC
    // LIMIT 10;

    return this.interactionRepo
      .createQueryBuilder('interaction')
      .select('interaction.adId', 'adId')
      .addSelect('COUNT(interaction.id)', 'count')
      .groupBy('interaction.adId')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany()
  }
}
