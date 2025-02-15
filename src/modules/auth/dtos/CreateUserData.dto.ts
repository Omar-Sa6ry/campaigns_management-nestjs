import { Field, InputType } from '@nestjs/graphql'
import { IsEmail, IsString, IsLowercase, Length, IsInt } from 'class-validator'
import { PasswordValidator } from 'src/common/constant/messages.constant'

@InputType()
export class CreateUserDto {
  @Field()
  @IsString()
  username: string

  @Field()
  @IsEmail()
  @IsLowercase()
  email: string

  @Field()
  @IsString()
  @Length(8, 16, { message: PasswordValidator })
  password: string

  @Field()
  @IsInt()
  campaignId: number
}
