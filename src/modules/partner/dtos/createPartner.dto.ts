import { Field, InputType, Int } from '@nestjs/graphql'
import { IsString, IsInt, IsPhoneNumber } from 'class-validator'

@InputType()
export class CreatePartnerDto {
  @Field()
  @IsString()
  name: string

  @Field(() => Int)
  @IsInt()
  campaignId: number

  @Field(() => Int)
  @IsPhoneNumber()
  phone: number
}
