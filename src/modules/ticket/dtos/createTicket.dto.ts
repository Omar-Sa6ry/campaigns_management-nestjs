import { Field, InputType, Int } from '@nestjs/graphql'
import { IsInt, IsDate } from 'class-validator'

@InputType()
export class CreateTicketDto {
  @Field(() => Int)
  @IsInt()
  campaignId: number

  @Field(() => Date)
  @IsDate()
  expireAt: Date
}
