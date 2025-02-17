import { Field, InputType } from '@nestjs/graphql'
import { IsString, IsDate, IsOptional } from 'class-validator'

@InputType()
export class CampaignDto {
  @IsOptional()
  @Field({ nullable: true })
  @IsString()
  name?: string

  @IsOptional()
  @Field({ nullable: true })
  @IsString()
  description?: string

  @IsOptional()
  @Field(() => Date, { nullable: true })
  @IsDate()
  startDate?: Date

  @IsOptional()
  @Field(() => Date, { nullable: true })
  @IsDate()
  endDate?: Date

  @IsOptional()
  @Field(() => Date, { nullable: true })
  @IsDate()
  createdAt?: Date
}
