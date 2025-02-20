import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Exclude } from 'class-transformer'
import { Role } from 'src/common/constant/enum.constant'
import { UserCampaign } from 'src/modules/userCampaign/entity/userCampaign.entity'
import { Interaction } from 'src/modules/interaction/entity/interaction.entity'
import { Ticket } from 'src/modules/ticket/entity/ticket.entity'
import { Partner } from 'src/modules/partner/entity/partner.entity'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from 'typeorm'

@ObjectType()
@Entity()
@Index('idx_username', ['username'])
@Index('idx_email', ['email'])
@Index('idx_phone', ['phone'])
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

  @Column({ unique: true })
  @Field()
  phone: number

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

  @OneToMany(() => Interaction, interaction => interaction.user, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @Field(() => [Interaction], { nullable: true })
  interactions: Interaction[]

  @OneToMany(() => Ticket, ticket => ticket.user, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @Field(() => [Ticket], { nullable: true })
  tickets: Ticket[]

  @OneToMany(() => Partner, partner => partner.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @Field(() => [Partner], { nullable: true })
  partners: Partner[]

  @OneToMany(() => UserCampaign, userCampaign => userCampaign.user, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @Field(() => [UserCampaign], { nullable: true })
  joinedCampaigns: UserCampaign[]
}
