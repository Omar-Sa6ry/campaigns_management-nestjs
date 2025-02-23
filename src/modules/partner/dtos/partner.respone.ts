import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { IsOptional } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { CampaignOutput } from 'src/modules/campaign/dtos/CampaignResponse'
import { CampaignInput } from 'src/modules/campaign/inputs/campain.input'

@ObjectType()
export class PartnerOutput {
  @Field(() => Int)
  id: number

  @Field(() => String)
  name: string

  @Field()
  phone: string

  @Field(() => Date)
  createdAt: Date

  @Expose()
  @Field(() => CampaignOutput)
  campaign: CampaignInput
}

@ObjectType()
export class PartnersResponse extends BaseResponse {
  @Field(() => [PartnerOutput], { nullable: true })
  @Expose()
  items?: PartnerOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class PartnerResponse extends BaseResponse {
  @Field(() => PartnerOutput, { nullable: true })
  @Expose()
  data: PartnerOutput
}
