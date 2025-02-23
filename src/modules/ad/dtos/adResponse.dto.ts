import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { IsOptional } from 'class-validator'
import { AdStatus, AdType } from 'src/common/constant/enum.constant'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { CampaignOutput } from 'src/modules/campaign/dtos/CampaignResponse'

@ObjectType()
export class AdOutput {
  @Field(() => Int)
  id: number

  @Field(() => String)
  title: string

  @Field(() => AdStatus, { nullable: true })
  status?: AdStatus

  @Field(() => AdType)
  type: AdType

  @Field(() => String)
  content: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => String, { nullable: true })
  url: string

  // @Field(() => Int, { nullable: true })
  // clicks?: number

  // @Field(() => Int, { nullable: true })
  // views?: number

  @Field(() => CampaignOutput)
  campaign: CampaignOutput
}

@ObjectType()
export class AdsResponse extends BaseResponse {
  @Field(() => [AdOutput], { nullable: true })
  @Expose()
  items: AdOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class AdResponse extends BaseResponse {
  @Field(() => AdOutput, { nullable: true })
  @Expose()
  data: AdOutput
}
