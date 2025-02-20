import {
  EmailIsWrong,
  EmailUsed,
  usernameUsed,
} from 'src/common/constant/messages.constant'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { UpdateUserDto } from './dtos/UpdateUser.dto'
import { User } from './entity/user.entity'
import { Role } from 'src/common/constant/enum.constant'
import { RedisService } from 'src/common/redis/redis.service'
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

@Injectable()
export class UserService {
  constructor (
    private readonly redisService: RedisService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async findById (id: number) {
    const user = await this.userRepository.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException(`User with this ${id} not found`)
    }

    const userCacheKey = `user:${user.id}`
    await this.redisService.set(userCacheKey, user)

    return user
  }

  async findByusername (username: string) {
    const user = await this.userRepository.findOne({ where: { username } })
    if (!user) {
      throw new NotFoundException(`User with ${username} not found`)
    }
    const userCacheKey = `user:${user.username}`
    await this.redisService.set(userCacheKey, user)
    return user
  }

  async findByEmail (email: string) {
    const user = await this.userRepository.findOne({ where: { email } })
    if (!user) {
      throw new NotFoundException(`User with ${email} not found`)
    }
    const userCacheKey = `user:${user.email}`
    await this.redisService.set(userCacheKey, user)
    return user
  }

  async updateUser (updateUserDto: UpdateUserDto, id: number) {
    const query = this.userRepository.manager.connection.createQueryRunner()
    await query.startTransaction()
    try {
      const user = await this.userRepository.findOne({ where: { id } })
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found.`)
      }

      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.userRepository.findOne({
          where: { email: updateUserDto.email },
        })
        if (existingUser) {
          throw new BadRequestException(EmailUsed)
        }
      }

      if (updateUserDto.username && updateUserDto.username !== user.username) {
        const existingUser = await this.userRepository.findOne({
          where: { username: updateUserDto.username },
        })
        if (existingUser) {
          throw new BadRequestException(usernameUsed)
        }
      }

      Object.assign(user, updateUserDto)

      const userCacheKey = `user:${user.email}`
      await this.redisService.set(userCacheKey, user)

      await this.userRepository.save(user)
      await query.commitTransaction()
      return user
    } catch (error) {
      await query.rollbackTransaction()
      throw error
    } finally {
      await query.release()
    }
  }

  async deleteUser (id: number) {
    const user = await this.findById(id)
    if (!(user instanceof User)) {
      throw new NotFoundException(EmailIsWrong)
    }

    await this.userRepository.remove(user)
    return `User with email : ${id} deleted Successfully`
  }

  async editUserRole (email: string) {
    const user = await this.findByEmail(email)
    if (!(user instanceof User)) {
      throw new NotFoundException(EmailIsWrong)
    }

    user.role = Role.ADMIN
    await this.userRepository.save(user)
    return `User with email : ${user.email} updated Successfully`
  }
}
