import { Field, InputType } from '@nestjs/graphql'
import { IsEmail, IsString, IsPhoneNumber, IsOptional } from 'class-validator'

@InputType()
export class UpdateUserDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  username?: string

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string

  @Field({ nullable: true })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string
}
