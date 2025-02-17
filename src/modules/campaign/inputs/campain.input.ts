import { Field, InputType, Int } from '@nestjs/graphql'
import { AdInput } from 'src/modules/ad/dtos/adInput.dto'

@InputType()
export class CampaignInput {
  @Field(() => Int)
  id: number

  @Field(() => String)
  name: string

  @Field(() => String)
  description: string

  @Field(() => String)
  status: string

  @Field(() => Date)
  startDate: Date

  @Field(() => Date)
  endDate: Date

  @Field(() => Date)
  createdAt: Date

  @Field(() => [AdInput], { nullable: true })
  ads: AdInput[]
}
