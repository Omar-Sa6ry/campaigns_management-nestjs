import { Field, InputType, Int } from '@nestjs/graphql'
import { TicketInput } from './ticket.input'
import { IsOptional } from 'class-validator'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { Expose } from 'class-transformer'

@InputType()
export class TicketsInput {
  @Field(() => [TicketInput], { nullable: true })
  items: TicketInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}
