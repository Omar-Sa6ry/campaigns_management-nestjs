import { Field, InputType } from '@nestjs/graphql'
import { IsInt } from 'class-validator'
import { AdInput } from 'src/modules/ad/dtos/adInput.dto'
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class InteractionInput {
  @Field()
  @IsInt()
  id: number

  @Field(() => String)
  type: string

  @Field(() => User)
  user: User

  @Field(() => AdInput)
  ad: AdInput

  @Field()
  createdAt: Date
}
