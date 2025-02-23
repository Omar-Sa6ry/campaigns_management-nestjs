import { Field, InputType, Int } from '@nestjs/graphql'
import { IsInt, IsDate } from 'class-validator'

@InputType()
export class CreatePdfDto {
  @Field(() => Int)
  id: number

  @Field()
  description: string

  @Field()
  email: string

  @Field(() => Date)
  @IsDate()
  startDate: Date

  @Field(() => Date)
  @IsDate()
  endDate: Date

  @Field(() => Date)
  @IsDate()
  createdAt: Date
}
