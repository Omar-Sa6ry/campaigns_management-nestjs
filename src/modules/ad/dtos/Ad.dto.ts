import { Field, InputType, Int } from '@nestjs/graphql'
import { IsString, IsInt, IsEnum, IsDate, IsOptional } from 'class-validator'
import { AdStatus, AdType } from 'src/common/constant/enum.constant'

@InputType()
export class AdDto {
  @IsOptional()
  @Field({ nullable: true }) // Add nullable: true
  @IsString()
  title?: string

  @IsOptional()
  @Field({ nullable: true }) // Add nullable: true
  @IsString()
  url?: string

  @IsOptional()
  @Field(() => AdType, { nullable: true }) // Add nullable: true
  type?: AdType

  @IsOptional()
  @Field(() => AdStatus, { nullable: true }) // Add nullable: true
  status?: AdStatus

  @IsOptional()
  @Field({ nullable: true }) // Add nullable: true
  @IsString()
  content?: string

  @IsOptional()
  @Field(() => Int, { nullable: true }) // Add nullable: true
  @IsInt()
  campaignId?: number // Fixed typo: "camaignId" -> "campaignId"

  @IsOptional()
  @Field(() => Date, { nullable: true })
  @IsDate()
  createdAt?: Date
}
