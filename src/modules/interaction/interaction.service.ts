import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Interaction } from './entity/interaction.entity'
import { InteractionInput } from './input/interaction.input'
import { AdService } from '../ad/ad.service'
import { InteractionsInput } from './input/interactions.input'
import { UserLoader } from '../users/loader/user.loader'
import { AdLoader } from '../ad/loader/ad.loader'
import { RedisService } from 'src/common/redis/redis.service'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { MostInteractedDto } from './input/mostInteraction.dto'
import { User } from '../users/entity/user.entity'
import { CreateInteractionDto } from './dtos/createInteraction.dto'
import {
  AdNotFound,
  InteractionNotFound,
  InteractionsNotFound,
  UserNotFound,
} from 'src/common/constant/messages.constant'
import { InteractionLoader } from './loader/interaction.loader'

@Injectable()
export class InteractionService {
  constructor (
    private readonly adService: AdService,
    private readonly interactionLoader: InteractionLoader,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketMessageGateway,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
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
      const ad = await this.adService.getAdById(interactionDto.adId)
      if (!ad) throw new NotFoundException(AdNotFound)

      const user = await this.userRepo.findOne({
        where: { id: userId },
      })
      if (!user) throw new NotFoundException(UserNotFound)

      const interaction = this.interactionRepo.create(interactionDto)
      await this.interactionRepo.save(interaction)

      const result = { ...interaction, user, ad }
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

    const ad = await this.adService.getAdById(interaction.adId)
    const user = await this.userRepo.findOne({
      where: { id: interaction.userId },
    })

    return { ...interaction, ad, user }
  }

  async get (page: number = 1, limit: number = 10): Promise<InteractionsInput> {
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

    return { items, total, page, totalPages: Math.ceil(total / limit) }
  }

  async getUserInteractions (
    userId: number,
    page: number = 1,
    limit: number = 10,
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

    const result = { items, total, page, totalPages: Math.ceil(total / limit) }
    const relationCacheKey = `interaction-user:${userId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async countAdInteractions (adId: number): Promise<number> {
    const ad = await this.adService.getAdById(adId)
    if (!ad) throw new BadRequestException(AdNotFound)

    return (await this.interactionRepo.count({ where: { adId } })) || 0
  }

  async getMostInteractedAds (limit: number = 10): Promise<MostInteractedDto[]> {
    // Sql Query
    // SELECT
    //     interaction.adId,
    //     COUNT(interaction.id) AS count
    // FROM interactions AS interaction
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
