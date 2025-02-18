import { Optional } from '@nestjs/common'
import { Field, InputType, Int } from '@nestjs/graphql'
import { IsString, IsInt,  IsPhoneNumber } from 'class-validator'

@InputType()
export class PartnerDto {
  @Optional()
  @Field()
  @IsString()
  name: string

  @Optional()
  @Field(() => Int)
  @IsInt()
  campaignId: number

  @Optional()
  @Field(() => Int)
  @IsPhoneNumber()
  phone: number
}
