import { Field, Int, ObjectType } from '@nestjs/graphql'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
} from 'typeorm'
import { Exclude } from 'class-transformer'
import { Role } from 'src/common/constant/enum.constant'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { UserCampaign } from 'src/modules/userCampaign/entity/userCampaign.entity'

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

  @OneToMany(() => UserCampaign, userCampaign => userCampaign.user, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @Field(() => [UserCampaign], { nullable: true })
  joinedCampaigns: UserCampaign[]
}
