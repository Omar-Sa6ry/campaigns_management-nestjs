import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm'
import { Campaign } from '../../campaign/entity/campaign.entity'

@ObjectType()
@Entity()
export class Partner {
  @PrimaryGeneratedColumn()
  @Field(() => Int)
  id: number

  @Column()
  @Field(() => String)
  name: string

  @Column()
  @Field(() => Int)
  phone: number

  @ManyToMany(() => Campaign, campaign => campaign.partners, { nullable: true })
  @Field(() => [Campaign], { nullable: true })
  campaigns: Campaign[]
}
