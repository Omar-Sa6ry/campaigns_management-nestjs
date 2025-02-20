import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Campaign } from '../../campaign/entity/campaign.entity'
import { Transform } from 'class-transformer'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  CreateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm'
import { PartnerStatus } from 'src/common/constant/enum.constant'
import { User } from 'src/modules/users/entity/user.entity'

@ObjectType()
@Entity()
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

  @Column({ unique: true })
  @Field(() => Int)
  phone: number

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

  @ManyToOne(() => Campaign, campaign => campaign.partners, { nullable: true })
  @Field(() => [Campaign], { nullable: true })
  @JoinColumn({ name: 'campaignId' })
  campaigns: Campaign[]
}
