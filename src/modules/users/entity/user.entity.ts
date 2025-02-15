import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm'
import { Exclude } from 'class-transformer'
import { Role } from 'src/common/constant/enum.constant'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'

@ObjectType()
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  @Field(() => Int)
  id: number

  @Column()
  @Field()
  username: string

  @Column({ unique: true })
  @Field()
  email: string

  @Column()
  @Exclude()
  password: string

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  @Exclude()
  role: Role

  @Column({ nullable: true })
  @Exclude()
  resetToken?: string

  @Column({ type: 'timestamp', nullable: true })
  @Exclude()
  resetTokenExpiry?: Date | null

  @Column({ nullable: true })
  @Exclude()
  fcmToken: string

  @ManyToMany(() => Campaign, campaign => campaign.users, { nullable: true })
  @Field(() => [Campaign])
  joinedCampaigns: Campaign[]
}
