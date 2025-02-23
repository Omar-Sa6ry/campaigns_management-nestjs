import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Campaign } from '../../campaign/entity/campaign.entity'
import { Transform } from 'class-transformer'
import { AdStatus, AdType } from 'src/common/constant/enum.constant'
import { Interaction } from 'src/modules/interaction/entity/interaction.entity'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  UpdateDateColumn,
  CreateDateColumn,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm'

@ObjectType()
@Entity()
@Index('idx_ad_campaign_id', ['campaignId'])
@Index('idx_ad_status', ['status'])
@Index('idx_ad_type', ['type'])
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
  @Field(() => AdType)
  type: AdType

  @Column({ nullable: true })
  @Field({ nullable: true })
  url: string

  @Column({
    type: 'enum',
    enum: AdStatus,
    default: AdStatus.PENDING,
  })
  @Field(() => AdStatus)
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

  @OneToMany(() => Interaction, interaction => interaction.ad, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @Field(() => [Interaction], { nullable: true })
  interactions: Interaction[]
}
