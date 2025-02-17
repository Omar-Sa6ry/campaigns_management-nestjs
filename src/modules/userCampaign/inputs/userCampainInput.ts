import { Field, InputType, Int } from '@nestjs/graphql'
import { IsInt } from 'class-validator'
import { User } from 'src/modules/users/entity/user.entity'
import { CampaignInput } from 'src/modules/campaign/inputs/campain.input'

@InputType()
export class UserCampaignInput {
  @Field()
  @IsInt()
  id: number

  @Field(() => User)
  user: User

  @Field(() => CampaignInput)
  campaign: CampaignInput

  @Field()
  joinAt: Date
}
