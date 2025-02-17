import { Field, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { IsInt, IsOptional } from 'class-validator'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { User } from 'src/modules/users/entity/user.entity'
import { CampaignOutput } from 'src/modules/campaign/dtos/CampaignResponse'
import { CampaignInput } from 'src/modules/campaign/inputs/campain.input'

@ObjectType()
export class UserCampaignOutput extends BaseResponse {
  @Field()
  @IsInt()
  id: number

  @Field(() => User)
  user: User

  @Field(() => CampaignOutput)
  campaign: CampaignInput

  @Field()
  joinAt: Date
}

@ObjectType()
export class UserCampaignsResponse extends BaseResponse {
  @Field(() => [UserCampaignOutput], { nullable: true })
  @Expose()
  items: UserCampaignOutput[]

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  @Expose()
  pagination?: PaginationInfo
}

@ObjectType()
export class UserCampaignResponse extends BaseResponse {
  @Field(() => UserCampaignOutput, { nullable: true })
  @Expose()
  data: UserCampaignOutput
}
