import { Field, InputType, Int } from '@nestjs/graphql'
import { UserCampaignInput } from './userCampainInput'

@InputType()
export class UserCampaignsInput {
  @Field(() => [UserCampaignInput], { nullable: true })
  items: UserCampaignInput[]

  @Field(() => Int)
  total: number

  @Field(() => Int)
  page: number

  @Field(() => Int)
  totalPages: number
}
