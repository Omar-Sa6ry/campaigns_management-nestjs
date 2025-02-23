import { Field, InputType, Int } from '@nestjs/graphql'
import { PartnerInput } from './partner.input'
import { Expose } from 'class-transformer'
import { IsOptional } from 'class-validator'
import { PaginationInfo } from 'src/common/dtos/pagintion'

@InputType()
export class PartnersInput {
  @Field(() => [PartnerInput], { nullable: true })
  items: PartnerInput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}
