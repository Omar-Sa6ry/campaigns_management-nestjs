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
import { CampaignLoader } from 'src/common/loaders/campaign.loader'
import { Campaign } from '../campaign/entity/campaign.entity'
import { UserCampaign } from '../userCampaign/entity/userCampaign.entity'
import { AdLoader } from 'src/common/loaders/ad.loader'
import { CampaignInput } from '../campaign/inputs/campain.input'
import { Repository } from 'typeorm'
import { CreateImagDto } from 'src/common/upload/dtos/createImage.dto'
import { CreateADto } from './dtos/createAd.dto'
import { UploadService } from 'src/common/upload/upload.service'
import { AdType } from 'src/common/constant/enum.constant'
import {
  AdNotFound,
  AdsNotFound,
  AdUrlForYouType,
  CampaignNotFound,
  DeleteAd,
  ImageError,
  UserCampaignsNotFound,
} from 'src/common/constant/messages.constant'

@Injectable()
export class AdService {
  constructor (
    private adLoader: AdLoader,
    private campaignLoader: CampaignLoader,
    private readonly redisService: RedisService,
    private readonly uploadService: UploadService,
    private readonly campaignService: CampaignService,
    private readonly websocketGateway: WebSocketMessageGateway,
    @InjectRepository(Ad)
    private adRepo: Repository<Ad>,
    @InjectRepository(Campaign)
    private campaignRepo: Repository<Campaign>,
    @InjectRepository(UserCampaign)
    private userCampaignRepo: Repository<UserCampaign>,
  ) {}

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
      })
      await this.adRepo.save(ad)

      const resilt: AdInput = {
        id: ad.id,
        type: ad.type,
        status: ad.status,
        url: ad.url,
        content: ad.content,
        title: ad.title,
        createdAt: ad.createdAt,
        campaign,
      }

      const relationCacheKey = `ad:${ad.id}`
      await this.redisService.set(relationCacheKey, resilt)

      await this.websocketGateway.broadcast('adCreated', {
        adId: ad.id,
        ad: resilt,
      })
      await query.commitTransaction()

      return resilt
    } catch (error) {
      await query.rollbackTransaction()
      throw error
    } finally {
      await query.release()
    }
  }

  async getAdById (id: number): Promise<AdInput> {
    const ad = await this.adRepo.findOne({
      where: { id },
      relations: ['campaign'],
    })
    if (!ad) throw new NotFoundException(AdNotFound)

    const campaign = await this.campaignService.getCampainById(ad.campaignId)
    if (!campaign) throw new NotFoundException(CampaignNotFound)

    const result: AdInput = {
      id: ad.id,
      type: ad.type,
      status: ad.status,
      url: ad.url,
      content: ad.content,
      title: ad.title,
      createdAt: ad.createdAt,
      campaign,
    }

    const relationCacheKey = `ad:${ad.id}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getAds (
    adDto: AdDto,
    page: number = 1,
    limit: number = 10,
  ): Promise<AdsInput> {
    const [data, total] = await this.adRepo.findAndCount({
      where: { ...adDto },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['campaign'],
      order: { createdAt: 'DESC' },
    })
    if (data.length == 0) throw new NotFoundException(AdsNotFound)

    const campaignIds = data.map(ad => ad.campaignId)
    const campaigns = await this.campaignLoader.loadMany(campaignIds)

    const adIds = campaigns.map(ad => ad.id)
    const ads = await this.adLoader.loadMany(adIds)

    const items = ads.map((ad, index) => {
      const campaign = campaigns[index]
      if (!campaign) throw new NotFoundException(CampaignNotFound)

      const adCampaign = ads[index]
      if (!adCampaign) throw new NotFoundException(AdNotFound)

      return {
        id: ad.id,
        type: ad.type,
        status: ad.status,
        url: ad.url,
        content: ad.content,
        title: ad.title,
        createdAt: ad.createdAt,
        campaign: {
          ...campaign,
          ads: [adCampaign],
        },
      }
    })

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  async listAds (page: number = 1, limit: number = 10): Promise<AdsInput> {
    const [data, total] = await this.adRepo.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    })
    if (data.length == 0) throw new NotFoundException(AdsNotFound)

    const campaignIds = data.map(ad => ad.campaignId)
    const campaigns = await this.campaignLoader.loadMany(campaignIds)

    // To get ads for all campaign in ad
    const adIds = campaigns.map(ad => ad.id)
    const ads = await this.adLoader.loadMany(adIds)

    const items = ads.map((ad, index) => {
      const campaign = campaigns[index]
      if (!campaign) throw new NotFoundException(CampaignNotFound)

      const adCampaign = ads[index]
      if (!adCampaign) throw new NotFoundException(AdNotFound)

      return {
        id: ad.id,
        type: ad.type,
        status: ad.status,
        url: ad.url,
        content: ad.content,
        title: ad.title,
        createdAt: ad.createdAt,
        campaign: {
          ...campaign,
          ads: [adCampaign],
        },
      }
    })

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getAdsFromUser (
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<AdsInput> {
    const [userCampaigns, total] = await this.userCampaignRepo.findAndCount({
      where: { userId },
      take: limit,
      skip: (page - 1) * limit,
      order: { joinAt: 'DESC' },
    })
    if (!userCampaigns) throw new BadRequestException(UserCampaignsNotFound)

    const campaignIds = userCampaigns.map(ad => ad.campaignId)
    const campaigns = await this.campaignLoader.loadMany(campaignIds)
    const adIds = campaigns.map(ad => ad.id)
    const ads = await this.adLoader.loadMany(adIds)

    const items: AdInput[] = ads.map((ad, index) => {
      const adCampaign = ads[index]
      if (!adCampaign) throw new NotFoundException(AdNotFound)

      const campaign = campaigns[index]
      if (!campaign) throw new NotFoundException(CampaignNotFound)

      return {
        id: ad.id,
        type: ad.type,
        status: ad.status,
        url: ad.url,
        content: ad.content,
        title: ad.title,
        createdAt: ad.createdAt,
        campaign: {
          ...campaign,
          ads: [adCampaign],
        },
      }
    })

    const result = { items, total, page, totalPages: Math.ceil(total / limit) }
    const relationCacheKey = `ad-user:${userId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

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
    if (!ads) throw new NotFoundException(AdsNotFound)

    const result: CampaignInput = { ...campaign, ads }

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
      const ad = await this.getAdById(id)
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

      await this.uploadService.deleteMedia(ad.url)
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
