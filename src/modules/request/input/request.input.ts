import { Field, InputType, Int } from '@nestjs/graphql'
import { PartnerInput } from 'src/modules/partner/input/partner.input'

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
