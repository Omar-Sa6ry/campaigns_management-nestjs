import { Field, InputType, Int } from '@nestjs/graphql'
import { InteractionInput } from './interaction.input'

@InputType()
export class InteractionsInput {
  @Field(() => [InteractionInput], { nullable: true })
  items: InteractionInput[]

  @Field(() => Int)
  total: number

  @Field(() => Int)
  page: number

  @Field(() => Int)
  totalPages: number
}
