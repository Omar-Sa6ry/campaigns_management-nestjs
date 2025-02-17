import { Field, InputType, Int } from '@nestjs/graphql'
import { CampaignInput } from './campain.input'

@InputType()
export class CampaignsInput {
  @Field(() => [CampaignInput], { nullable: true })
  items: CampaignInput[]

  @Field(() => Int)
  total: number

  @Field(() => Int)
  page: number

  @Field(() => Int)
  totalPages: number
}
