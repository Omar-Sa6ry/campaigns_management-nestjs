import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'
import { Campaign } from '../../campaign/entity/campaign.entity'

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

  @Column()
  @Field()
  type: string

  @Column()
  @Field()
  status: string

  @ManyToOne(() => Campaign, campaign => campaign.id, { nullable: true })
  @Field(() => Campaign)
  campaign: Campaign
}
