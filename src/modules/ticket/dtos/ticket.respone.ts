import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { IsOptional } from 'class-validator'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { CampaignOutput } from 'src/modules/campaign/dtos/CampaignResponse'
import { User } from 'src/modules/users/entity/user.entity'

@ObjectType()
export class TicketOutput {
  @Field(() => Int)
  id: number

  @Field(() => String)
  status: string

  @Field(() => Date)
  expireAt: Date

  @Field(() => Date)
  createdAt: Date

  @Field(() => User)
  user: User

  @Field(() => CampaignOutput)
  campaign: CampaignOutput
}

@ObjectType()
export class TicketsResponse extends BaseResponse {
  @Field(() => [TicketOutput], { nullable: true })
  @Expose()
  items: TicketOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class TicketResponse extends BaseResponse {
  @Field(() => TicketOutput, { nullable: true })
  @Expose()
  data: TicketOutput
}
