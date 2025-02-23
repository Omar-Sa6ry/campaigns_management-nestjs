import { Field, InputType, Int } from '@nestjs/graphql'
import { RequestInput } from './request.input'
import { Expose } from 'class-transformer'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { IsOptional } from 'class-validator'

@InputType()
export class RequestsInput {
  @Field(() => [RequestInput], { nullable: true })
  items: RequestInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}
