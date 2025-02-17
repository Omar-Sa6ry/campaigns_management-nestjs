import { Field, Int, ObjectType } from '@nestjs/graphql'
import {
  AfterInsert,
  AfterRemove,
  AfterUpdate,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity()
@ObjectType()
@Index('idx_image_path', ['path'])
export class Image {
  @PrimaryGeneratedColumn()
  @Field(() => Int)
  id: number

  @Column()
  @Field(() => String)
  path: string

  @Field(() => Int)
  @Column()
  postId: number

  // @ManyToOne(() => Post, post => post.images, { onDelete: 'CASCADE' })
  // post: Post

  @AfterInsert()
  logInsert () {
    console.log('Inserted Images with id: ' + this.id)
  }

  @AfterUpdate()
  logUpdate () {
    console.log('Updated Images with id: ' + this.id)
  }

  @AfterRemove()
  logRemove () {
    console.log('Removed Images with id: ' + this.id)
  }
}
