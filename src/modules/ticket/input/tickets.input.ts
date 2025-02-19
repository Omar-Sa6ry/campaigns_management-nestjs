import { Field, InputType, Int } from '@nestjs/graphql'
import { TicketInput } from './ticket.input'

@InputType()
export class TicketsInput {
  @Field(() => [TicketInput], { nullable: true })
  items: TicketInput[]

  @Field(() => Int)
  total: number

  @Field(() => Int)
  page: number

  @Field(() => Int)
  totalPages: number
}
