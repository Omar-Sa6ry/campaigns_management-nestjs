import { Field, InputType, Int } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { IsOptional } from 'class-validator'
import { AdStatus, AdType } from 'src/common/constant/enum.constant'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { CampaignInput } from 'src/modules/campaign/inputs/campain.input'

@InputType()
export class AdInput {
  @Field(() => Int)
  id: number

  @Field(() => Int, { nullable:true})
  clicks?: number

  @Field(() => Int, { nullable:true})
  views?: number

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

  @Field(() => CampaignInput)
  campaign: CampaignInput
}

@InputType()
export class AdsInput {
  @Field(() => [AdInput], { nullable: true })
  items: AdInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}
