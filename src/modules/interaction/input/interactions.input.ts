import { Field, InputType } from '@nestjs/graphql'
import { InteractionInput } from './interaction.input'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { Expose } from 'class-transformer'
import { IsOptional } from 'class-validator'

@InputType()
export class InteractionsInput {
  @Field(() => [InteractionInput], { nullable: true })
  items: InteractionInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}
