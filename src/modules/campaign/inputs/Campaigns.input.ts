import { Field, InputType, Int } from '@nestjs/graphql'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { Campaign } from '../entity/campaign.entity'

@InputType()
export class CampaignsInput extends BaseResponse {
  @Field(() => [Campaign], { nullable: true })
  items: Campaign[]

  @Field(() => Int)
  total: number

  @Field(() => Int)
  page: number

  @Field(() => Int)
  totalPages: number
}
