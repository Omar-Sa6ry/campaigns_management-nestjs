import { Field, InputType, Int } from '@nestjs/graphql'
import { CampaignStatus } from 'src/common/constant/enum.constant'
import { AdInput } from 'src/modules/ad/dtos/adInput.dto'
import { Partner } from 'src/modules/partner/entity/partner.entity'

@InputType()
export class CampaignInput {
  @Field(() => Int)
  id: number

  @Field(() => String)
  name: string

  @Field(() => String)
  description: string

  @Field(() => CampaignStatus)
  status: CampaignStatus
  @Field(() => Date)
  startDate: Date

  @Field(() => Date)
  endDate: Date

  @Field(() => Date)
  createdAt: Date

  @Field(() => [AdInput], { nullable: true })
  ads: AdInput[]

  @Field(() => [Partner], { nullable: true })
  partners: Partner[]
}
