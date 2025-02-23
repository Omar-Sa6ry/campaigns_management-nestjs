import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { IsOptional } from 'class-validator'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { AdOutput } from 'src/modules/ad/dtos/adResponse.dto'
import { Partner } from 'src/modules/partner/entity/partner.entity'
import { CampaignStatus } from 'src/common/constant/enum.constant'

@ObjectType()
export class CampaignOutput {
  @Field(() => Int)
  id: number

  @Field(() => String)
  name: string

  @Field(() => String)
  description: string

  @Field(() => CampaignStatus)
  status: CampaignStatus

  @Field(() => Date)
  startDate: Date

  @Field(() => Date)
  endDate: Date

  @Field(() => Date)
  createdAt: Date

  @Field(() => [AdOutput], { nullable: true })
  ads: AdOutput[]

  @Field(() => [Partner], { nullable: true })
  partners: Partner[]
}

@ObjectType()
export class CampaignsResponse extends BaseResponse {
  @Field(() => [CampaignOutput], { nullable: true })
  @Expose()
  items: CampaignOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class CampaignResponse extends BaseResponse {
  @Field(() => CampaignOutput, { nullable: true })
  @Expose()
  data: CampaignOutput
}
