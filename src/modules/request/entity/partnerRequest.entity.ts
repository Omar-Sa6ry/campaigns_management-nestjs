import { User } from 'src/modules/users/entity/user.entity'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { Field, Int } from '@nestjs/graphql'
import { Transform } from 'class-transformer'
import { PartnerStatus } from 'src/common/constant/enum.constant'
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm'
import { Partner } from 'src/modules/partner/entity/partner.entity'

@Entity()
export class PartnerRequest {
  @PrimaryGeneratedColumn()
  @Field(() => Int)
  id: number

  @Column()
  @Field(() => Int)
  campaignId: number

  @Column()
  @Field(() => Int)
  userId: number

  @Column()
  @Field(() => Int)
  partnerId: number

  @Column({ type: 'enum', enum: PartnerStatus, default: PartnerStatus.PENDING })
  @Field()
  status: PartnerStatus

  @CreateDateColumn({ type: 'timestamp' })
  @Transform(({ value }) => (value ? new Date(value).toLocaleString() : null), {
    toClassOnly: true,
  })
  @Field()
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp' })
  @Transform(({ value }) => (value ? new Date(value).toLocaleString() : null), {
    toClassOnly: true,
  })
  @Field()
  updateAt: Date

  @ManyToOne(() => User, user => user.requests)
  @JoinColumn({ name: 'userId' })
  user: User

  @ManyToOne(() => User, user => user.requests)
  @JoinColumn({ name: 'partnerId' })
  partner: Partner

  @ManyToOne(() => Campaign, campaign => campaign.requests)
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign
}
