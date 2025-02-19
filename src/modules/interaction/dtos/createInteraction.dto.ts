import { Field, InputType, Int } from '@nestjs/graphql'
import { IsInt, IsEnum } from 'class-validator'
import { InterActionType } from 'src/common/constant/enum.constant'

@InputType()
export class CreateInteractionDto {
  @Field(() => InterActionType)
  @IsEnum(InterActionType)
  type: InterActionType

  @Field(() => Int)
  @IsInt()
  adId: number
}
