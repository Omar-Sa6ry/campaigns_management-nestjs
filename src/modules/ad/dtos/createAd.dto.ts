import { Field, InputType, Int } from '@nestjs/graphql'
import { IsString,  IsInt, IsEnum } from 'class-validator'
import { AdType } from 'src/common/constant/enum.constant'

@InputType()
export class CreateADto {
  @Field()
  @IsString()
  title: string

  @Field(() => AdType)
  @IsEnum(AdType)
  type: AdType

  @Field()
  @IsString()
  content: string

  @Field(() => Int)
  @IsInt()
  camaignId: number
}
