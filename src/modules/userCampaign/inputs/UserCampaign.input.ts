import { Field, InputType, Int } from '@nestjs/graphql'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { UserCampaign } from 'src/modules/userCampaign/entity/userCampaign.entity'

@InputType()
export class UserCampaignsInput extends BaseResponse {
  @Field(() => [UserCampaign], { nullable: true })
  items: UserCampaign[]

  @Field(() => Int)
  total: number

  @Field(() => Int)
  page: number

  @Field(() => Int)
  totalPages: number
}