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
import { AdInput, AdsInput } from '../ad/dtos/adInput.dto'
import { PartnerDto } from './dtos/Partner.dto'
import { PartnersInput } from './input/partners.input'
import { CampaignInput } from '../campaign/inputs/campain.input'
// import { UserCampaign } from '../userCampaign/entity/userCampaign.entity'
import { PartnerLoader } from 'src/modules/partner/loader/partner.loader'
import { CampaignService } from '../campaign/campaign.service'
import { User } from '../users/entity/user.entity'
import { RedisService } from 'src/common/redis/redis.service'
import { CampaignLoader } from 'src/modules/campaign/loader/campaign.loader'
import { AdService } from '../ad/ad.service'
import { CreatePartnerDto } from './dtos/createPartner.dto'
import {
  AdsNotFound,
  CampaignNotFound,
  DeletePartner,
  Limit,
  Page,
  PartnerNotFound,
  PartnersNotFound,
  // UserCampaignsNotFound,
  UserNotFound,
} from 'src/common/constant/messages.constant'

@Injectable()
export class PartnerService {
  constructor (
    private partnerLoader: PartnerLoader,
    private campaignLoader: CampaignLoader,
    private adService: AdService,
    private campaignService: CampaignService,
    private readonly redisService: RedisService,
    @InjectRepository(Ad) private adRepo: Repository<Ad>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Campaign) private campaignRepo: Repository<Campaign>,
    @InjectRepository(Partner) private partnerRepo: Repository<Partner>,
    // @InjectRepository(UserCampaign)
    // private userCampaignRepo: Repository<UserCampaign>,
  ) {}

  async create (createPartner: CreatePartnerDto): Promise<PartnerInput> {
    const query = this.campaignRepo.manager.connection.createQueryRunner()
    await query.startTransaction()

    try {
      const campaign = await this.campaignRepo.findOne({
        where: { id: createPartner.campaignId },
      })
      if (!campaign) throw new BadRequestException(CampaignNotFound)

      const user = await this.userRepo.findOne({
        where: { id: createPartner.userId },
      })
      if (!user) throw new BadRequestException(UserNotFound)

      const partner = await this.partnerRepo.create({
        ...createPartner,
        name: user.username,
        phone: user.phone,
      })
      await this.partnerRepo.save(partner)

      const ads = await this.adRepo.find({
        where: { campaignId: campaign.id },
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
    if (!campaign) throw new BadRequestException(CampaignNotFound)

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
    limit: number = Limit,
    page: number = Page,
  ): Promise<PartnersInput> {
    const [data, total] = await this.partnerRepo.findAndCount({
      where: partnerDto,
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    })
    if (data.length === 0) throw new NotFoundException(PartnersNotFound)

    const partnerIds = data.map(partner => partner.id)
    const partners = await this.partnerLoader.loadMany(partnerIds)

    const items: PartnerInput[] = data.map((p, index) => {
      const partner = partners[index]
      if (!partner) throw new NotFoundException(PartnerNotFound)

      return partner
    })

    return {
      items,
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    }
  }

  async getPartners (
    limit: number = Limit,
    page: number = Page,
  ): Promise<PartnersInput> {
    const [data, total] = await this.partnerRepo.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    })
    if (data.length === 0) throw new NotFoundException(PartnersNotFound)

    const partnerIds = data.map(partner => partner.id)
    const partners = await this.partnerLoader.loadMany(partnerIds)

    const items: PartnerInput[] = await Promise.all(
      data.map(async (p, index) => {
        const partner = partners[index]
        if (!partner) throw new NotFoundException(PartnerNotFound)

        return partner
      }),
    )

    return {
      items,
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    }
  }

  async getPartnersFromUser (
    userId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<PartnersInput> {
    const [data, total] = await this.partnerRepo.findAndCount({
      where: { userId },
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    })
    if (data.length === 0) throw new NotFoundException(PartnersNotFound)

    const partnerIds = data.map(partner => partner.id)
    const partners = await this.partnerLoader.loadMany(partnerIds)

    const items: PartnerInput[] = partners.map((p, index) => {
      const partner = partners[index]
      if (!partner) throw new NotFoundException(PartnerNotFound)

      return partner
    })

    const result = {
      items,
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    }
    const relationCacheKey = `partner-user:${userId}`
    await this.redisService.set(relationCacheKey, result)

    return result
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

  async getAdsFromPartner (
    partnerId: number,
    page: number = Page,
    limit: number = Limit,
  ): Promise<AdsInput> {
    const partner = await this.partnerRepo.findOne({ where: { id: partnerId } })
    if (!partner) throw new BadRequestException(PartnerNotFound)

    const campaign = await this.campaignService.getCampainById(
      partner.campaignId,
    )
    if (!campaign) throw new BadRequestException(CampaignNotFound)

    const ads = await this.adService.getAdsFromCampaign(
      campaign.id,
      page,
      limit,
    )
    if (!(ads instanceof AdsInput)) throw new BadRequestException(AdsNotFound)

    return ads
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
