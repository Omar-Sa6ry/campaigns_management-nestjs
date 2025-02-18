import { Field, InputType, Int } from '@nestjs/graphql'
import { CampaignInput } from 'src/modules/campaign/inputs/campain.input'

@InputType()
export class PartnerInput {
  @Field(() => Int)
  id: number

  @Field(() => String)
  name: string

  @Field(() => Int)
  phone: number

  @Field(() => Date)
  createdAt: Date

  @Field(() => CampaignInput)
  campaign: CampaignInput
}
