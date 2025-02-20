import { Field, InputType, Int } from '@nestjs/graphql'
import { RequestInput } from './request.input'

@InputType()
export class RequestsInput {
  @Field(() => [RequestInput], { nullable: true })
  items: RequestInput[]

  @Field(() => Int)
  total: number

  @Field(() => Int)
  page: number

  @Field(() => Int)
  totalPages: number
}
