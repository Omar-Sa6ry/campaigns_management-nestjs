import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { IsOptional } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { CampaignOutput } from 'src/modules/campaign/dtos/CampaignResponse'
import { CampaignInput } from 'src/modules/campaign/inputs/campain.input'

@ObjectType()
export class AdOutput {
  @Field(() => Int)
  id: number

  @Field(() => String)
  title: string

  @Field(() => String)
  status: string

  @Field(() => String)
  type: string

  @Field(() => String)
  content: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => String, { nullable: true })
  url: string

  @Field(() => CampaignOutput)
  campaign: CampaignInput
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
