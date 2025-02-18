import * as DataLoader from 'dataloader'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from 'src/modules/users/entity/user.entity'

@Injectable()
export class UserLoader {
  private loader: DataLoader<number, any>

  constructor (
    @InjectRepository(User)
    private UserRepo: Repository<User>,
  ) {
    this.loader = new DataLoader<number, any>(async (keys: number[]) => {
      const Users = await this.UserRepo.findByIds(keys)
      const UserMap = new Map(
        Users.map(User => [User.id, User]),
      )
      return keys.map(id => UserMap.get(id))
    })
  }

  load (id: number): Promise<User> {
    return this.loader.load(id)
  }

  loadMany (ids: number[]): Promise<User[]> {
    return this.loader.loadMany(ids)
  }
}
