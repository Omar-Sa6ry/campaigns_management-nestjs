import { Field, InputType } from '@nestjs/graphql'
import { PasswordValidator } from 'src/common/constant/messages.constant'
import {
  IsEmail,
  IsString,
  IsLowercase,
  Length,
  IsPhoneNumber,
} from 'class-validator'

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
  @IsPhoneNumber()
  phone: string

  @Field()
  @IsString()
  @Length(8, 16, { message: PasswordValidator })
  password: string
}
