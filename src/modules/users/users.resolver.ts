import { CurrentUserDto } from 'src/common/dtos/currentUser.dto'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { UserService } from './users.service'
import { ParseIntPipe } from '@nestjs/common'
import { UpdateUserDto } from './dtos/UpdateUser.dto'
import { Role } from 'src/common/constant/enum.constant'
import { CurrentUser } from 'src/common/decerator/currentUser.decerator'
import { RedisService } from 'src/common/redis/redis.service'
import { Auth } from 'src/common/decerator/auth.decerator'
import { UserResponse } from './dtos/UserResponse.dto'
import { User } from './entity/user.entity'

@Resolver(() => User)
export class UserResolver {
  constructor (
    private usersService: UserService,
    private readonly redisService: RedisService,
  ) {}

  @Query(returns => UserResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async getUserById (
    @Args('id', ParseIntPipe) id: number,
  ): Promise<UserResponse> {
    const userCacheKey = `user:${id}`
    const cachedUser = await this.redisService.get(userCacheKey)
    if (cachedUser instanceof User) {
      return { data: cachedUser }
    }

    return { data: await this.usersService.findById(id) }
  }

  @Query(returns => UserResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async getUserByEmail (@Args('email') email: string): Promise<UserResponse> {
    const userCacheKey = `user:${email}`
    const cachedUser = await this.redisService.get(userCacheKey)
    if (cachedUser instanceof User) {
      return { data: cachedUser }
    }

    return { data: await this.usersService.findByEmail(email) }
  }

  @Query(returns => UserResponse)
  async getUserByusername (
    @Args('username') username: string,
  ): Promise<UserResponse> {
    const userCacheKey = `user:${username}`
    const cachedUser = await this.redisService.get(userCacheKey)
    if (cachedUser instanceof User) {
      return { data: cachedUser }
    }

    return { data: await this.usersService.findByusername(username) }
  }

  @Mutation(returns => UserResponse)
  @Auth(Role.ADMIN, Role.MANAGER)
  async updateUser (
    @Args('updateUserDto') updateUserDto: UpdateUserDto,
    @CurrentUser() user: CurrentUserDto,
  ): Promise<UserResponse> {
    return { data: await this.usersService.updateUser(updateUserDto, user?.id) }
  }

  @Query(returns => String)
  @Auth(Role.ADMIN, Role.MANAGER)
  async deleteUser (@CurrentUser() user: CurrentUserDto) {
    return await this.usersService.deleteUser(user.id)
  }

  @Mutation(returns => String)
  @Auth(Role.ADMIN, Role.MANAGER)
  async UpdateUserRole (
    @Args('checkEmail') email: string,
    @Args('companyId', ParseIntPipe) companyId: number,
  ) {
    return await this.usersService.editUserRole(email)
  }
}
