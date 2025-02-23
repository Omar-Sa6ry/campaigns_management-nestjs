import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Campaign } from '../../campaign/entity/campaign.entity'
import { PartnerStatus } from 'src/common/constant/enum.constant'
import { User } from 'src/modules/users/entity/user.entity'
import { Transform } from 'class-transformer'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm'

@ObjectType()
@Entity()
@Index('idx_partner_campaign_id', ['campaignId'])
@Index('idx_partner_user_id', ['userId'])
@Index('idx_partner_status', ['status'])
@Unique(['campaignId', 'userId'])
export class Partner {
  @PrimaryGeneratedColumn()
  @Field(() => Int)
  id: number

  @Column()
  @Field(() => String)
  name: string

  @Column({ type: 'enum', enum: PartnerStatus, default: PartnerStatus.PENDING })
  @Field()
  status: PartnerStatus

  @Column()
  @Field(() => String)
  phone: string

  @Column()
  @Field(() => Int)
  campaignId: number

  @Column()
  @Field(() => Int)
  userId: number

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

  @ManyToOne(() => User, user => user.partners, { nullable: true })
  @JoinColumn({ name: 'userId' })
  users: User[]

  @ManyToOne(() => Partner, partner => partner.requests, { nullable: true })
  requests: Request[]

  @ManyToOne(() => Campaign, campaign => campaign.partners, {
    eager: true,
    nullable: true,
  })
  @Field(() => [Campaign], { nullable: true })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign[]
}
