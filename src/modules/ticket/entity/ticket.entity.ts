import { User } from '../../users/entity/user.entity'
import { Campaign } from '../../campaign/entity/campaign.entity'
import { Field, Int, ObjectType } from '@nestjs/graphql'
import { TicketType } from 'src/common/constant/enum.constant'
import { Transform } from 'class-transformer'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm'

@Entity()
@ObjectType()
@Index('idx_ticket_user_id', ['userId'])
@Index('idx_ticket_campaign_id', ['campaignId'])
@Index('idx_ticket_status', ['status'])
@Index('idx_ticket_expireAt', ['expireAt'])
@Unique('uq_ticket_user_campaign', ['userId', 'campaignId'])
export class Ticket {
  @PrimaryGeneratedColumn()
  @Field(() => Int)
  id: number

  @Column()
  @Field(() => Int)
  userId: number

  @Column()
  @Field(() => Int)
  campaignId: number

  @Column({ type: 'timestamp' })
  @Field(() => Date)
  expireAt: Date

  @Column({
    type: 'enum',
    enum: TicketType,
    default: TicketType.VAILD,
  })
  status: TicketType

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

  @ManyToOne(() => User, user => user.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User

  @ManyToOne(() => Campaign, campaign => campaign.tickets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign
}
