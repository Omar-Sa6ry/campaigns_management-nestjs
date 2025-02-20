import { User } from '../../users/entity/user.entity'
import { InterActionType } from 'src/common/constant/enum.constant'
import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Ad } from '../../ad/entity/ad.entity'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm'

@ObjectType()
@Entity()
@Index('idx_interaction_user_id', ['userId'])
@Index('idx_interaction_id', ['adId'])
@Index('idx_iteraction_type', ['type'])
@Index('idx_interaction_user_ad', ['userId', 'adId'])
export class Interaction {
  @PrimaryGeneratedColumn()
  @Field(() => Int)
  id: number

  @Column()
  @Field(() => Int)
  userId: number

  @Column()
  @Field(() => Int)
  adId: number

  @ManyToOne(() => User, user => user.interactions, { onDelete: 'SET NULL' })
  @Field(() => User)
  @JoinColumn({ name: 'userId' })
  user: User

  @ManyToOne(() => Ad, ad => ad.interactions, { onDelete: 'SET NULL' })
  @Field(() => Ad)
  @JoinColumn({ name: 'adId' })
  ad: Ad

  @Column({
    type: 'enum',
    enum: InterActionType,
  })
  @Field()
  type: InterActionType

  @CreateDateColumn()
  @Field(() => Date)
  createdAt: Date
}
