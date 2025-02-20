import { Field, InputType, Int } from '@nestjs/graphql'
import { CampaignInput } from 'src/modules/campaign/inputs/campain.input'
import { PartnerInput } from 'src/modules/partner/input/partner.input'
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class RequestInput {
  @Field(() => Int)
  id: number

  @Field(() => String)
  status: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => PartnerInput)
  partner: PartnerInput
}
