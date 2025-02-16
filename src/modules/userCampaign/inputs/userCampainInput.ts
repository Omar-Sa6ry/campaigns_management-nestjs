import { Field, InputType, Int } from '@nestjs/graphql'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { IsInt } from 'class-validator'
import { User } from 'src/modules/users/entity/user.entity'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'

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
