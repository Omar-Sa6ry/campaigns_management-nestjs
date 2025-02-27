import { Partner } from 'src/modules/partner/entity/partner.entity'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { Field, Int, ObjectType } from '@nestjs/graphql'
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
  OneToMany,
  Index,
} from 'typeorm'

@Entity()
@ObjectType()
@Index('idx_request_campaign_id', ['campaignId'])
@Index('idx_request_partner_id', ['partnerId'])
@Index('idx_request_status', ['status'])
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

  @OneToMany(() => Partner, partner => partner.requests)
  @JoinColumn({ name: 'partnerId' })
  partner: Partner[]

  @ManyToOne(() => Campaign, campaign => campaign.requests)
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign
}
