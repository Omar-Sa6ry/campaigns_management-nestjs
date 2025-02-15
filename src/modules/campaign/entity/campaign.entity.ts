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
} from 'typeorm'
import { User } from 'src/modules/users/entity/user.entity'

@ObjectType()
@Entity()
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

  @Column({ type: 'date' })
  @Field()
  startDate: Date

  @Column({ type: 'date' })
  @Field()
  endDate: Date

  @Column({ length: 50 })
  @Field()
  status: string

  @OneToMany(() => Ad, ad => ad.campaign, { nullable: true })
  @Field(() => [Ad], { nullable: true })
  ads: Ad[]

  @ManyToMany(() => User, user => user.joinedCampaigns, { nullable: true })
  @JoinTable()
  @Field(() => [User], { nullable: true })
  users: User[]

  @ManyToMany(() => Partner, partner => partner.campaigns, { nullable: true })
  @JoinTable()
  @Field(() => [Partner], { nullable: true })
  partners: Partner[]
}
