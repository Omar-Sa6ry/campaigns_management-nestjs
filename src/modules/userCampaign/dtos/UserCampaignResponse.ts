import { Field, ObjectType } from '@nestjs/graphql'
import { Expose } from 'class-transformer'
import { BaseResponse } from 'src/common/dtos/BaseResponse'
import { IsInt, IsOptional } from 'class-validator'
import { PaginationInfo } from 'src/common/dtos/pagintion'
import { UserCampaign } from 'src/modules/userCampaign/entity/userCampaign.entity'
import { UserCampaignsInput } from '../../campaign/inputs/UserCampaign.input'
import { UserCampaignInput } from '../../campaign/inputs/userCampainInput'
import { User } from 'src/modules/users/entity/user.entity'
import { Campaign } from '../../campaign/entity/campaign.entity'

@ObjectType()
export class UserCampaignOutput extends BaseResponse {
  @Field()
  @IsInt()
  id: number

  @Field(() => User)
  user: User

  @Field(() => Campaign)
  campaign: Campaign

  @Field()
  joinAt: Date
}

@ObjectType()
export class UserCampaignsResponse extends BaseResponse {
  @Field(() => [UserCampaign], { nullable: true })
  @Expose()
  items: UserCampaign[]

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
