import { Field, InputType, Int } from '@nestjs/graphql'
import { IsString, IsInt, IsOptional } from 'class-validator'

@InputType()
export class PartnerDto {
  @IsOptional()
  @Field({ nullable: true })
  @IsString()
  name?: string

  @IsOptional()
  @Field(() => Int, { nullable: true })
  @IsInt()
  campaignId?: number
}
