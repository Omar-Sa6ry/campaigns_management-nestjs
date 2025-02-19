import { ObjectType, Field, Int } from '@nestjs/graphql'

@ObjectType()
export class MostInteractedDto {
  @Field(() => Int)
  adId: number

  @Field(() => Int)
  count: number
}
