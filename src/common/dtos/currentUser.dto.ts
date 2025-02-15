import { Field, Int, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class CurrentUserDto {
  @Field(() => Int)
  id: number

  @Field(() => String)
  email: string
}
