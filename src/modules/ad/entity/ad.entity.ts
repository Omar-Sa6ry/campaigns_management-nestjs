import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Campaign } from '../../campaign/entity/campaign.entity'
import { Transform } from 'class-transformer'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  UpdateDateColumn,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm'
import { AdStatus, AdType } from 'src/common/constant/enum.constant'

@ObjectType()
@Entity()
export class Ad {
  @PrimaryGeneratedColumn()
  @Field(() => Int)
  id: number

  @Column()
  @Field()
  title: string

  @Column()
  @Field()
  content: string

  @Column({
    type: 'enum',
    enum: AdType,
  })
  @Field()
  type: AdType

  @Column({ nullable: true })
  @Field({ nullable: true })
  url: string

  @Column({
    type: 'enum',
    enum: AdStatus,
    default: AdStatus.PENDING,
  })
  @Field()
  status: AdStatus

  @Column()
  @Field(() => Int)
  campaignId: number

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

  @ManyToOne(() => Campaign, campaign => campaign.id, { nullable: true })
  @JoinColumn({ name: 'campaignId' })
  @Field(() => Campaign)
  campaign: Campaign
}
