import { Field, InputType, Int } from '@nestjs/graphql'
import { CampaignInput } from 'src/modules/campaign/inputs/campain.input'
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class TicketInput {
  @Field(() => Int)
  id: number

  @Field(() => String)
  status: string

  @Field(() => Date)
  expireAt: Date

  @Field(() => Date)
  createdAt: Date

  @Field(() => User)
  user: User

  @Field(() => CampaignInput)
  campaign: CampaignInput
}
