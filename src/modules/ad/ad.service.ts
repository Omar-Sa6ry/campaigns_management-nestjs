import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { RedisService } from 'src/common/redis/redis.service'
import { WebSocketMessageGateway } from 'src/common/websocket/websocket.gateway'
import { Ad } from './entity/ad.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { AdInput, AdsInput } from './dtos/adInput.dto'
import { CampaignService } from '../campaign/campaign.service'
import { AdDto } from './dtos/Ad.dto'
import { CampaignLoader } from 'src/modules/campaign/loader/campaign.loader'
import { Campaign } from '../campaign/entity/campaign.entity'
// import { UserCampaign } from '../userCampaign/entity/userCampaign.entity'
import { Partner } from '../partner/entity/partner.entity'
import { AdLoader } from 'src/modules/ad/loader/ad.loader'
import { CampaignInput } from '../campaign/inputs/campain.input'
import { Repository } from 'typeorm'
import { CreateImagDto } from 'src/common/upload/dtos/createImage.dto'
import { CreateADto } from './dtos/createAd.dto'
import { UploadService } from 'src/common/upload/upload.service'
import { AdType, InterActionType } from 'src/common/constant/enum.constant'
import {
  AdNotFound,
  AdsNotFound,
  AdUrlForYouType,
  CampaignNotFound,
  DeleteAd,
  ImageError,
  Limit,
  Page,
  UserCampaignsNotFound,
} from 'src/common/constant/messages.constant'
import { InteractionService } from '../interaction/interaction.service'
import { SendEmailService } from 'src/common/queues/email/sendemail.service'

@Injectable()
export class AdService {
  constructor (
    private adLoader: AdLoader,
    private readonly redisService: RedisService,
    private readonly uploadService: UploadService,
    private readonly campaignService: CampaignService,
    private readonly websocketGateway: WebSocketMessageGateway,
    private readonly interactionService: InteractionService,
    @InjectRepository(Ad)
    private adRepo: Repository<Ad>,
    @InjectRepository(Campaign)
    private campaignRepo: Repository<Campaign>,
    @InjectRepository(Partner)
    private partnerRepo: Repository<Partner>,
  ) // @InjectRepository(UserCampaign)
  // private userCampaignRepo: Repository<UserCampaign>,
  {}

  async create (
    createAd: CreateADto,
    createMediaDo?: CreateImagDto,
  ): Promise<AdInput> {
    if (createAd.type !== AdType.TEXT && !createMediaDo) {
      throw new BadRequestException(AdUrlForYouType)
    }

    const query = this.adRepo.manager.connection.createQueryRunner()
    await query.startTransaction()

    try {
      const campaign = await this.campaignService.getCampainById(
        createAd.camaignId,
      )
      if (!campaign) throw new NotFoundException(CampaignNotFound)

      let url: string | null
      try {
        if (createAd.type !== AdType.TEXT) {
          url = await this.uploadService.uploadMedia(createMediaDo, 'ads')
        }
      } catch (error) {
        throw new BadRequestException(ImageError)
      }

      const ad = this.adRepo.create({
        ...createAd,
        url,
        campaignId: campaign.id,
      })
      await this.adRepo.save(ad)

      const ads = await this.adRepo.find({
        where: { campaignId: campaign.id },
        relations: ['campaign'],
      })

      const partners = await this.partnerRepo.find({
        where: { campaignId: campaign.id },
      })

      const result: AdInput = {
        ...ad,
        campaign: {
          ...campaign,
          partners,
          ads,
        },
      }

      const relationCacheKey = `ad:${ad.id}`
      await this.redisService.set(relationCacheKey, result)

      await this.websocketGateway.broadcast('adCreated', {
        adId: ad.id,
        ad: result,
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

  async getAdById (id: number, userId?: number): Promise<AdInput> {
    const ad = await this.adRepo.findOne({
      where: { id },
      relations: ['campaign'],
    })
    if (!ad) throw new NotFoundException(AdNotFound)

    const campaign = await this.campaignService.getCampainById(ad.campaignId)
    if (!campaign) throw new NotFoundException(CampaignNotFound)

    const ads = await this.adRepo.find({
      where: { campaignId: campaign.id },
      relations: ['campaign'],
    })

    const partners = await this.partnerRepo.find({
      where: { campaignId: campaign.id },
    })

    if (userId) {
      await this.interactionService.create(userId, {
        type: InterActionType.CLICK,
        adId: ad.id,
      })
    }
    const clicks = await this.interactionService.countAdClick(ad.id)
    const views = await this.interactionService.countAdClick(ad.id)

    const result = {
      ...ad,
      clicks,
      views,
      campaign: { ...campaign, ads, partners },
    }

    const relationCacheKey = `ad:${ad.id}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getAds (
    adDto: AdDto,
    page: number = Page,
    limit: number = Limit,
    userId?: number,
  ): Promise<AdsInput> {
    const [data, total] = await this.adRepo.findAndCount({
      where: { ...adDto },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['campaign'],
      order: { createdAt: 'DESC' },
    })
    if (data.length == 0) throw new NotFoundException(AdsNotFound)

    const adIds = data.map(ad => ad.id)
    const ads = await this.adLoader.loadMany(adIds)

    const items = await Promise.all(
      ads.map(async (a, index) => {
        const ad = ads[index]
        if (!ad) throw new NotFoundException(AdNotFound)

        if (userId) {
          await this.interactionService.create(userId, {
            type: InterActionType.CLICK,
            adId: ad.id,
          })
        }

        return ad
      }),
    )

    return {
      items,
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    }
  }

  async getAdsFromCampaign (
    campaignId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<AdsInput> {
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId },
    })
    if (!campaign) throw new NotFoundException(CampaignNotFound)

    const [data, total] = await this.adRepo.findAndCount({
      where: { campaignId },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['campaign'],
      order: { createdAt: 'DESC' },
    })
    if (data.length == 0) throw new NotFoundException(AdsNotFound)

    const adIds = data.map(ad => ad.id)
    const ads = await this.adLoader.loadMany(adIds)

    const items = ads.map((a, index) => {
      const ad = ads[index]
      if (!ad) throw new NotFoundException(AdNotFound)

      return ad
    })

    return {
      items,
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    }
  }

  async listAds (page: number = Page, limit: number = Limit): Promise<AdsInput> {
    const [data, total] = await this.adRepo.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    })
    if (data.length == 0) throw new NotFoundException(AdsNotFound)

    const adIds = data.map(ad => ad.id)
    const ads = await this.adLoader.loadMany(adIds)

    const items = ads.map((a, index) => {
      const ad = ads[index]
      if (!ad) throw new NotFoundException(AdNotFound)

      return ad
    })

    return {
      items,
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    }
  }

  // async getAdsFromUser (
  //   userId: number,
  //   page: number = Page,
  //   limit: number = Limit,
  // ): Promise<AdsInput> {
  //   const [userCampaigns, total] = await this.userCampaignRepo.findAndCount({
  //     where: { userId },
  //     take: limit,
  //     skip: (page - 1) * limit,
  //     order: { joinAt: 'DESC' },
  //   })
  //   if (!userCampaigns) throw new BadRequestException(UserCampaignsNotFound)

  //   const campaignIds = userCampaigns.map(ad => ad.campaignId)
  //   const campaigns = await this.campaignLoader.loadMany(campaignIds)

  //   const adIds = campaigns.map(campaign => campaign.ads.map(i => i.id)).flat()
  //   const ads = await this.adLoader.loadMany(adIds)

  //   const items: AdInput[] = ads.map((a, index) => {
  //     const ad = ads[index]
  //     if (!ad) throw new NotFoundException(AdNotFound)

  //     const campaign = campaigns[index]
  //     if (!campaign) throw new NotFoundException(CampaignNotFound)

  //     return ad
  //   })

  //   const result = { items, total, page, totalPages: Math.ceil(total / limit) }
  //   const relationCacheKey = `ad-user:${userId}`
  //   await this.redisService.set(relationCacheKey, result)

  //   return result
  // }

  async getCampaignFromAd (campaignId: number): Promise<CampaignInput> {
    const ad = await this.adRepo.findOne({
      where: { campaignId },
      relations: ['campaign'],
    })
    if (!ad) throw new NotFoundException(AdNotFound)

    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId },
    })
    if (!campaign) throw new NotFoundException(CampaignNotFound)

    const ads = await this.adRepo.find({
      where: { campaignId: campaign.id },
      relations: ['campaign'],
    })

    const partners = await this.partnerRepo.find({
      where: { campaignId: campaign.id },
      relations: ['campaign'],
    })

    const result: CampaignInput = { ...campaign, ads, partners }

    const relationCacheKey = `ad:${ad.id}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async updateAd (
    id: number,
    updateAdDto: AdDto,
    createMediaDo?: CreateImagDto,
  ): Promise<AdInput> {
    const query = this.adRepo.manager.connection.createQueryRunner()
    await query.startTransaction()

    try {
      const ad = await this.adRepo.findOne({ where: { id } })
      if (!ad) throw new NotFoundException(AdNotFound)

      if (createMediaDo && updateAdDto.type !== AdType.TEXT) {
        await this.uploadService.deleteMedia(ad.url)
        const url = await this.uploadService.uploadMedia(createMediaDo, 'ads')
        await this.adRepo.update(id, { url })
      }

      await this.adRepo.update(id, updateAdDto)
      await this.websocketGateway.broadcast('adUpdated', {
        adId: id,
      })
      await query.commitTransaction()

      return this.getAdById(id)
    } catch (error) {
      await query.rollbackTransaction()
      throw error
    } finally {
      await query.release()
    }
  }

  async deleteAd (id: number): Promise<string> {
    const query = this.adRepo.manager.connection.createQueryRunner()
    await query.startTransaction()

    try {
      const ad = await this.adRepo.findOne({ where: { id } })
      if (!ad) throw new NotFoundException(AdNotFound)

      if (ad.url) {
        await this.uploadService.deleteMedia(ad.url)
      }
      await this.adRepo.remove(ad)

      await this.websocketGateway.broadcast('adDeleted', {
        adId: id,
      })

      await query.commitTransaction()

      return DeleteAd
    } catch (error) {
      await query.rollbackTransaction()
      throw error
    } finally {
      await query.release()
    }
  }
}
