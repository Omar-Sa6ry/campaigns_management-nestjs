import { Field, InputType, Int } from '@nestjs/graphql'
import { CampaignInput } from 'src/modules/campaign/inputs/campain.input'

@InputType()
export class AdInput {
  @Field(() => Int)
  id: number

  @Field(() => String)
  title: string

  @Field(() => String)
  status: string

  @Field(() => String)
  type: string

  @Field(() => String)
  content: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => String, { nullable: true })
  url: string

  @Field(() => CampaignInput)
  campaign: CampaignInput
}

@InputType()
export class AdsInput {
  @Field(() => [AdInput], { nullable: true })
  items: AdInput[]

  @Field(() => Int)
  total: number

  @Field(() => Int)
  page: number

  @Field(() => Int)
  totalPages: number
}
