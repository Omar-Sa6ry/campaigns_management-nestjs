import { Field, InputType, Int } from '@nestjs/graphql'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { Campaign } from '../entity/campaign.entity'
import { IsInt } from 'class-validator'
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class UserCampaignInput extends BaseResponse {
  @Field()
  @IsInt()
  id: number

  @Field(() => User)
  user: User

  @Field(() => Campaign)
  campaign: Campaign

  @Field()
  joinAt: Date
}
