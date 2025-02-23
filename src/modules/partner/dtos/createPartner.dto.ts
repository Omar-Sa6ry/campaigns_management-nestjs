import { Field, InputType, Int } from '@nestjs/graphql'
import { IsInt } from 'class-validator'

@InputType()
export class CreatePartnerDto {
  @Field(() => Int)
  @IsInt()
  campaignId: number

  @Field(() => Int)
  @IsInt()
  userId: number
}
