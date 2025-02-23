import { User } from 'src/modules/users/entity/user.entity';
import { Transform } from 'class-transformer'
import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Partner } from '../../partner/entity/partner.entity'
import { CampaignStatus } from 'src/common/constant/enum.constant'
import { PartnerRequest } from 'src/modules/request/entity/partnerRequest.entity'
// import { UserCampaign } from 'src/modules/userCampaign/entity/userCampaign.entity'
import { Ticket } from 'src/modules/ticket/entity/ticket.entity'
import { Ad } from '../../ad/entity/ad.entity'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  Index,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm'

@ObjectType()
@Entity()
@Index('idx_campaign_name', ['name'])
@Index('idx_campaign_status', ['status'])
@Index('idx_campaign_start_date', ['startDate'])
@Index('idx_campaign_end_date', ['endDate'])
@Index('idx_campaign_created_at', ['createdAt'])
export class Campaign {
  @PrimaryGeneratedColumn()
  @Field(() => Int)
  id: number

  @Column()
  @Field()
  name: string

  @Column()
  @Field()
  description: string

  @Column({ type: 'timestamp' })
  @Field()
  startDate: Date

  @Column({ type: 'timestamp' })
  @Field()
  endDate: Date

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.PENDING,
  })
  @Field()
  status: CampaignStatus

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

  @OneToMany(() => Ad, ad => ad.campaign, { nullable: true })
  @Field(() => [Ad], { nullable: true })
  ads: Ad[]

  // @OneToMany(() => UserCampaign, userCampaign => userCampaign.campaign, {
  //   nullable: true,
  //   onDelete: 'SET NULL',
  // })
  // @Field(() => [UserCampaign], { nullable: true })
  // joinedCampaigns: UserCampaign[]

  @OneToMany(() => Ticket, ticket => ticket.campaign, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @Field(() => [Ticket], { nullable: true })
  tickets: Ticket[]

  @OneToMany(() => PartnerRequest, PartnerRequest => PartnerRequest.campaign, {
    nullable: true,
  })
  requests: PartnerRequest[]

  @OneToMany(() => Partner, partner => partner.campaign, { nullable: true })
  @Field(() => [Partner], { nullable: true })
  partners: Partner[]

  @ManyToOne(() => User, user => user.campaigns, { onDelete: 'SET NULL' })
  @Field(() => User)
  @JoinColumn({ name: 'userId' })
  user: User
}
