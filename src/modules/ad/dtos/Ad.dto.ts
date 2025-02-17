import { Field, InputType, Int } from '@nestjs/graphql'
import { IsString, IsInt, IsEnum, IsDate, IsOptional } from 'class-validator'
import { AdStatus, AdType } from 'src/common/constant/enum.constant'

@InputType()
export class AdDto {
  @IsOptional()
  @Field()
  @IsString()
  title?: string

  @IsOptional()
  @Field()
  @IsString()
  url?: string

  @IsOptional()
  @Field(() => AdType)
  @IsEnum(AdType)
  type?: AdType

  @IsOptional()
  @Field(() => AdStatus)
  @IsEnum(AdStatus)
  status?: AdStatus

  @IsOptional()
  @Field()
  @IsString()
  content?: string

  @IsOptional()
  @Field(() => Int)
  @IsInt()
  camaignId?: number

  @IsOptional()
  @Field(() => Date, { nullable: true })
  @IsDate()
  createdAt?: Date
}
