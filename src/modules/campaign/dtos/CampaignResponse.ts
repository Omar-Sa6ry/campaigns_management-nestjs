import { Field, ObjectType } from '@nestjs/graphql'
import { Campaign } from '../entity/campaign.entity'
import { Expose } from 'class-transformer'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { IsOptional } from 'class-validator'
import { PaginationInfo } from 'src/common/dtos/pagintion'

@ObjectType()
export class CampaignsResponse extends BaseResponse {
  @Field(() => [Campaign], { nullable: true })
  @Expose()
  items: Campaign[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class CampaignResponse extends BaseResponse {
  @Field(() => Campaign, { nullable: true })
  @Expose()
  data: Campaign
}
