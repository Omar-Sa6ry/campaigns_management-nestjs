import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { IsOptional } from 'class-validator'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { PartnerOutput } from 'src/modules/partner/dtos/partner.respone'

@ObjectType()
export class RequestOutput {
  @Field(() => Int)
  id: number

  @Field(() => String)
  status: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => PartnerOutput)
  partner: PartnerOutput
}

@ObjectType()
export class RequestsResponse extends BaseResponse {
  @Field(() => [RequestOutput], { nullable: true })
  @Expose()
  items: RequestOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class RequestResponse extends BaseResponse {
  @Field(() => RequestOutput, { nullable: true })
  @Expose()
  data: RequestOutput
}
