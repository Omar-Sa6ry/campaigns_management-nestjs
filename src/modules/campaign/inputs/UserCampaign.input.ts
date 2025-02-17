import { Field, InputType, Int } from '@nestjs/graphql'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { UserCampaignInput } from './userCampainInput'

@InputType()
export class UserCampaignsInput extends BaseResponse {
  @Field(() => [UserCampaignInput], { nullable: true })
  items: UserCampaignInput[]

  @Field(() => Int)
  total: number

  @Field(() => Int)
  page: number

  @Field(() => Int)
  totalPages: number
}