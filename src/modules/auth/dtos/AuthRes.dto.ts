import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { User } from 'src/modules/users/entity/user.entity'

@InputType()
export class AuthInput{
  @Field(() => User)
  user: User

  @Field()
  token: string
}

@ObjectType()
export class AuthOutPut extends BaseResponse {
  @Field(() => User)
  @Expose()
  user: User

  @Field()
  @Expose()
  token: string
}

@ObjectType()
export class AuthResponse extends BaseResponse {
  @Field(() => AuthOutPut, { nullable: true })
  @Expose()
  data: AuthOutPut
}
