import * as DataLoader from 'dataloader'
import { UserNotFound } from '../constant/messages.constant'
import { Repository,  } from 'typeorm'
import { User } from 'src/modules/users/entity/user.entity'

export function createUserLoader (userRepository: Repository<User>) {
  return new DataLoader<number, User>(async (userIds: number[]) => {
    const users = await userRepository.findByIds(userIds)
    const userMap = new Map(users.map(user => [user.id, user]))
    return userIds.map(id => userMap.get(id) || new Error(UserNotFound))
  })
}


