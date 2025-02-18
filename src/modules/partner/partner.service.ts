import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Campaign } from '../campaign/entity/campaign.entity'
import { Partner } from './entity/partner.entity'
import { Ad } from '../ad/entity/ad.entity'
import { PartnerInput } from './input/partner.input'
import { AdInput } from '../ad/dtos/adInput.dto'
import { PartnerDto } from './dtos/Partner.dto'
import { PartnersInput } from './input/partners.input'
import { CampaignInput } from '../campaign/inputs/campain.input'
import { UserCampaign } from '../userCampaign/entity/userCampaign.entity'
import { PartnerLoader } from 'src/modules/partner/loader/partner.loader'
import { RedisService } from 'src/common/redis/redis.service'
import { CampaignLoader } from 'src/modules/campaign/loader/campaign.loader'
import { CreatePartnerDto } from './dtos/createPartner.dto'
import {
  CampaignNotFound,
  DeletePartner,
  PartnerNotFound,
  PartnersNotFound,
  PhoneIsExisted,
  UserCampaignsNotFound,
} from 'src/common/constant/messages.constant'

@Injectable()
export class PartnerService {
  constructor (
    private partnerLoader: PartnerLoader,
    private campaignLoader: CampaignLoader,
    private readonly redisService: RedisService,
    @InjectRepository(Ad) private adRepo: Repository<Ad>,
    @InjectRepository(Campaign) private campaignRepo: Repository<Campaign>,
    @InjectRepository(Partner) private partnerRepo: Repository<Partner>,
    @InjectRepository(UserCampaign)
    private userCampaignRepo: Repository<UserCampaign>,
  ) {}

  async create (createPartner: CreatePartnerDto): Promise<PartnerInput> {
    const query = this.campaignRepo.manager.connection.createQueryRunner()
    await query.startTransaction()

    try {
      const checkPhone = await this.partnerRepo.findOne({
        where: { phone: createPartner.phone },
      })
      if (checkPhone) {
        throw new BadRequestException(PhoneIsExisted)
      }

      const campaign = await this.campaignRepo.findOne({
        where: { id: createPartner.campaignId },
      })
      if (campaign) throw new BadRequestException(CampaignNotFound)

      const partner = await this.partnerRepo.create(createPartner)
      await this.partnerRepo.save(partner)

      const ads = await this.adRepo.find({
        where: { campaignId: campaign.id },
        relations: ['campaign'],
      })

      const partners = await this.partnerRepo.find({
        where: { campaignId: campaign.id },
      })

      const adsInput: AdInput[] = await ads.map(ad => {
        return {
          ...ad,
          campaign,
          partners,
        }
      })

      const result = {
        ...partner,
        campaign: {
          ...campaign,
          ads: adsInput,
          partners,
        },
      }
      const relationCacheKey = `partner:${partner.id}`
      await this.redisService.set(relationCacheKey, result)

      await query.commitTransaction()

      return result
    } catch (error) {
      await query.rollbackTransaction()
      throw error
    } finally {
      await query.release()
    }
  }

  async getPartnerById (id: number): Promise<PartnerInput> {
    const partner = await this.partnerRepo.findOne({
      where: { id },
      relations: ['campaign'],
    })

    if (!partner) throw new NotFoundException(PartnerNotFound)

    const campaign = await this.campaignRepo.findOne({
      where: { id: partner.campaignId },
    })
    if (campaign) throw new BadRequestException(CampaignNotFound)

    const ads = await this.adRepo.find({
      where: { campaignId: campaign.id },
      relations: ['campaign'],
    })

    const partners = await this.partnerRepo.find({
      where: { campaignId: campaign.id },
    })

    const adsInput: AdInput[] = await ads.map(ad => {
      return {
        ...ad,
        campaign,
        partners,
      }
    })

    const result = {
      ...partner,
      campaign: {
        ...campaign,
        ads: adsInput,
        partners,
      },
    }
    const relationCacheKey = `partner:${partner.id}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async getPartnersWithData (
    partnerDto: PartnerDto,
    limit: number = 10,
    page: number = 1,
  ): Promise<PartnersInput> {
    const [data, total] = await this.partnerRepo.findAndCount({
      where: partnerDto,
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    })
    if (data.length === 0) throw new NotFoundException(PartnersNotFound)

    const campaignIds = data.map(ad => ad.campaignId)
    const campaigns = await this.campaignLoader.loadMany(campaignIds)

    const items: PartnerInput[] = await Promise.all(
      data.map(async (partner, index) => {
        const campaign = campaigns[index]
        if (!campaign) throw new NotFoundException(CampaignNotFound)

        const ads = await this.adRepo.find({
          where: { campaignId: campaign.id },
          relations: ['campaign'],
        })

        const partners = await this.partnerRepo.find({
          where: { campaignId: campaign.id },
        })

        const adsInput: AdInput[] = await ads.map(ad => {
          return {
            ...ad,
            campaign,
            partners,
          }
        })

        return {
          ...partner,
          campaign: {
            ...campaign,
            ads: adsInput,
            partners: partners.map(p => ({
              ...p,
              campaign: { ...campaign },
            })),
          },
        }
      }),
    )
    return { items, total, page, totalPages: Math.ceil(total / limit) }
  }

  async getPartners (
    limit: number = 10,
    page: number = 1,
  ): Promise<PartnersInput> {
    const [data, total] = await this.partnerRepo.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    })
    if (data.length === 0) throw new NotFoundException(PartnersNotFound)

    const campaignIds = data.map(ad => ad.campaignId)
    const campaigns = await this.campaignLoader.loadMany(campaignIds)

    const items: PartnerInput[] = await Promise.all(
      data.map(async (partner, index) => {
        const campaign = campaigns[index]
        if (!campaign) throw new NotFoundException(CampaignNotFound)

        const ads = await this.adRepo.find({
          where: { campaignId: campaign.id },
          relations: ['campaign'],
        })

        const partners = await this.partnerRepo.find({
          where: { campaignId: campaign.id },
        })

        const adsInput: AdInput[] = await ads.map(ad => {
          return {
            ...ad,
            campaign,
            partners,
          }
        })

        return {
          ...partner,
          campaign: {
            ...campaign,
            ads: adsInput,
            partners: partners.map(p => ({
              ...p,
              campaign: { ...campaign },
            })),
          },
        }
      }),
    )
    return { items, total, page, totalPages: Math.ceil(total / limit) }
  }

  async getPartnersFromUser (
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<PartnersInput> {
    const [userCampaigns, total] = await this.userCampaignRepo.findAndCount({
      where: { userId },
      take: limit,
      skip: (page - 1) * limit,
      order: { joinAt: 'DESC' },
    })
    if (!userCampaigns) throw new BadRequestException(UserCampaignsNotFound)

    const campaignIds = userCampaigns.map(ad => ad.campaignId)
    const campaigns = await this.campaignLoader.loadMany(campaignIds)

    const partnerpIds = campaigns.map(campaign => campaign.id)
    const partners = await this.partnerLoader.loadMany(partnerpIds)

    const items: PartnerInput[] = await Promise.all(
      partners.map(async (partner, index) => {
        const campaign = campaigns[index]
        if (!campaign) throw new NotFoundException(CampaignNotFound)

        const ads = await this.adRepo.find({
          where: { campaignId: campaign.id },
          relations: ['campaign'],
        })

        const partners = await this.partnerRepo.find({
          where: { campaignId: campaign.id },
        })

        const adsInput: AdInput[] = await ads.map(ad => {
          return {
            ...ad,
            campaign,
            partners,
          }
        })

        const result = {
          ...partner,
          campaign: {
            ...campaign,
            ads: adsInput,
            partners: partners.map(p => ({
              ...p,
              campaign: { ...campaign },
            })),
          },
        }
        const relationCacheKey = `partner-user:${userId}`
        await this.redisService.set(relationCacheKey, result)

        return result
      }),
    )
    return { items, total, page, totalPages: Math.ceil(total / limit) }
  }

  async getCampaignFromPartner (campaignId: number): Promise<CampaignInput> {
    const partner = await this.partnerRepo.findOne({
      where: { campaignId },
      relations: ['campaign'],
    })
    if (!partner) throw new NotFoundException(PartnerNotFound)

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

    const relationCacheKey = `partner-campaign:${campaignId}`
    await this.redisService.set(relationCacheKey, result)

    return result
  }

  async updatePartner (
    id: number,
    updateData: PartnerDto,
  ): Promise<PartnerInput> {
    const query = this.campaignRepo.manager.connection.createQueryRunner()
    await query.startTransaction()

    try {
      const partner = await this.partnerRepo.findOne({
        where: { id },
        relations: ['campaign'],
      })

      if (!partner) throw new NotFoundException(PartnerNotFound)

      Object.assign(partner, updateData)
      await this.partnerRepo.save(partner)

      const campaign = await this.campaignRepo.findOne({
        where: { id: partner.campaignId },
      })

      const ads = await this.adRepo.find({
        where: { campaignId: campaign.id },
        relations: ['campaign'],
      })

      const partners = await this.partnerRepo.find({
        where: { campaignId: campaign.id },
      })

      const adsInput: AdInput[] = await ads.map(ad => {
        return {
          ...ad,
          campaign,
          partners,
        }
      })

      const result = {
        ...partner,
        campaign: {
          ...campaign,
          ads: adsInput,
          partners,
        },
      }
      const relationCacheKey = `partner:${partner.id}`
      await this.redisService.set(relationCacheKey, result)

      await query.commitTransaction()

      return result
    } catch (error) {
      await query.rollbackTransaction()
      throw error
    } finally {
      await query.release()
    }
  }

  async deletePartner (id: number): Promise<string> {
    const query = this.campaignRepo.manager.connection.createQueryRunner()
    await query.startTransaction()

    try {
      const partner = await this.partnerRepo.findOne({ where: { id } })
      if (!partner)
        throw new NotFoundException(`Partner with ID ${id} not found`)
      await this.partnerRepo.remove(partner)
      await query.commitTransaction()

      return DeletePartner
    } catch (error) {
      await query.rollbackTransaction()
      throw error
    } finally {
      await query.release()
    }
  }
}
