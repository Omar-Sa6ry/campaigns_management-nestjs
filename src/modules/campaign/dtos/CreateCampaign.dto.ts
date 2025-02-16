import { Field, InputType } from '@nestjs/graphql'
import { IsString, IsDate } from 'class-validator'

@InputType()
export class CreateCampaignCDto {
  @Field()
  @IsString()
  name: string

  @Field()
  @IsString()
  description: string

  @Field(() => Date)
  @IsDate()
  startDate: Date

  @Field(() => Date)
  @IsDate()
  endDate: Date
}
