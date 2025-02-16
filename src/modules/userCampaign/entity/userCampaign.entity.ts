import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Partner } from '../../partner/entity/partner.entity'
import { Ad } from '../../ad/entity/ad.entity'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm'
import { User } from 'src/modules/users/entity/user.entity'
import { CampaignStatus } from 'src/common/constant/enum.constant'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { Transform } from 'class-transformer'

@ObjectType()
@Entity()
export class UserCampaign {
  @PrimaryGeneratedColumn()
  @Field(() => Int)
  id: number

  @Column()
  @Field(() => Int)
  campaignId: number

  @Column()
  @Field(() => Int)
  userId: number

  @CreateDateColumn({ type: 'date' })
  @Transform(({ value }) => new Date(value).toLocaleString(), {
    toClassOnly: true,
  })
  joinAt: Date

  @ManyToOne(() => Campaign, campaign => campaign.joinedCampaigns, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'campaignId' })
  @Field(() => Campaign, { nullable: true })
  campaign: Campaign

  @ManyToOne(() => User, user => user.joinedCampaigns, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'userId' })
  @Field(() => User, { nullable: true })
  user: User
}
