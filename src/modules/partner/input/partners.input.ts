import { Field, InputType, Int } from '@nestjs/graphql'
import { PartnerInput } from './partner.input'

@InputType()
export class PartnersInput {
  @Field(() => [PartnerInput], { nullable: true })
  items: PartnerInput[]

  @Field(() => Int)
  total: number

  @Field(() => Int)
  page: number

  @Field(() => Int)
  totalPages: number
}
