import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { UserService } from '../users/users.service'
import { GenerateToken } from '../../common/config/jwt.service'
import { MoreThan, Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { HashPassword } from './utils/hashPassword'
import { randomBytes } from 'crypto'
import { ChangePasswordDto } from './dtos/ChangePassword.dto'
import { ResetPasswordDto } from './dtos/ResetPassword.dto'
import { LoginDto } from './dtos/Login.dto'
import { ComparePassword } from './utils/comparePassword'
import { Role } from 'src/common/constant/enum.constant'
import { SendEmailService } from 'src/common/queues/email/sendemail.service'
import { RedisService } from 'src/common/redis/redis.service'
import { CreateUserDto } from './dtos/CreateUserData.dto'
import {
  EmailIsWrong,
  EndOfEmail,
  InvalidToken,
  IsnotAdmin,
  IsnotManager,
  OldPasswordENewPassword,
  SamePassword,
} from 'src/common/constant/messages.constant'
import { User } from '../users/entity/user.entity'
import { AuthInput } from './dtos/AuthRes.dto'

@Injectable()
export class AuthService {
  constructor (
    private userService: UserService,
    private generateToken: GenerateToken,
    private readonly redisService: RedisService,
    private readonly sendEmailService: SendEmailService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async register (
    fcmToken: string,
    createUserDto: CreateUserDto,
  ): Promise<AuthInput> {
    const { username, email, phone } = createUserDto
    if (!email.endsWith('@gmail.com')) {
      throw new BadRequestException(EndOfEmail)
    }
    const query = this.userRepository.manager.connection.createQueryRunner()
    await query.startTransaction()

    try {
      const user = await this.userRepository.create({
        username,
        email,
        phone,
        password: await HashPassword(createUserDto.password),
      })
      await this.userRepository.save(user)

      user.fcmToken = fcmToken
      await this.userRepository.save(user)
      await this.sendEmailService.sendEmail(
        email,
        'Register in App',
        `You registered successfully in the App`,
      )

      const token = await this.generateToken.jwt(user?.email, user?.id)
      await this.userRepository.save(user)
      const result = { user, token }
      const userCacheKey = `user:${email}`
      await this.redisService.set(userCacheKey, result)

      return result
    } catch (error) {
      await query.rollbackTransaction()
      throw error
    } finally {
      await query.release()
    }
  }

  async login (fcmToken: string, loginDto: LoginDto) {
    const { email, password } = loginDto

    let user = await this.userService.findByEmail(email.toLowerCase())
    if (!(user instanceof User)) {
      throw new NotFoundException(EmailIsWrong)
    }

    await ComparePassword(password, user?.password)
    const token = await this.generateToken.jwt(user?.email, user?.id)
    const userCacheKey = `user:${email}`
    await this.redisService.set(userCacheKey, { user, token })
    user.fcmToken = fcmToken
    await this.userRepository.save(user)
    return { user, token }
  }

  async forgotPassword (email: string) {
    const lowerEmail = email.toLowerCase()
    const user = await this.userService.findByEmail(lowerEmail)
    if (!(user instanceof User)) {
      throw new NotFoundException(EmailIsWrong)
    }
    if (user.role !== Role.USER) {
      throw new BadRequestException(IsnotAdmin + ', you cannot edit this user')
    }

    const token = randomBytes(32).toString('hex')
    user.resetToken = token
    user.resetTokenExpiry = new Date(Date.now() + 900000) // 15 minutes
    const link = `http://localhost:3000/grapql/reset-password?token=${token}`
    await this.userRepository.save(user)

    await this.sendEmailService.sendEmail(
      lowerEmail,
      'Forgot Password',
      `click here to be able to change your password ${link}`,
    )

    return `${user.username} ,Message sent successfully for your gmail`
  }

  async resetPassword (resetPassword: ResetPasswordDto) {
    const query = this.userRepository.manager.connection.createQueryRunner()
    await query.startTransaction()

    try {
      const { password, token } = resetPassword
      const user = await this.userRepository.findOne({
        where: {
          resetToken: token,
          resetTokenExpiry: MoreThan(new Date(Date.now())),
        },
      })
      if (!user) {
        throw new BadRequestException(InvalidToken)
      }

      user.password = await HashPassword(password)
      await this.userRepository.save(user)
      return `${user.username} ,your password is Updated Successfully`
    } catch (error) {
      await query.rollbackTransaction()
      throw error
    } finally {
      await query.release()
    }
  }

  async changePassword (id: number, changePassword: ChangePasswordDto) {
    const query = this.userRepository.manager.connection.createQueryRunner()
    await query.startTransaction()

    try {
      const { password, newPassword } = changePassword
      if (password === newPassword) {
        throw new BadRequestException(SamePassword)
      }

      const user = await this.userService.findById(id)
      if (!(user instanceof User)) {
        throw new NotFoundException(EmailIsWrong)
      }
      if (user.password === (await HashPassword(password))) {
        throw new BadRequestException(OldPasswordENewPassword)
      }

      user.password = await HashPassword(newPassword)
      await this.userRepository.save(user)
      return `${user.username} ,your password is Updated Successfully`
    } catch (error) {
      await query.rollbackTransaction()
      throw error
    } finally {
      await query.release()
    }
  }

  async adminLogin (loginDto: LoginDto) {
    const { email, password } = loginDto

    let user = await this.userService.findByEmail(email.toLowerCase())
    if (!(user instanceof User)) {
      throw new NotFoundException(EmailIsWrong)
    }

    if (user.role !== (Role.ADMIN || Role.MANAGER)) {
      throw new UnauthorizedException(IsnotAdmin)
    }
    await ComparePassword(password, user?.password)
    const token = await this.generateToken.jwt(user?.email, user?.id)
    const userCacheKey = `user:${email}`
    await this.redisService.set(userCacheKey, { user, token })

    return { user, token }
  }

  async managerLogin (loginDto: LoginDto) {
    const { email, password } = loginDto

    let user = await this.userService.findByEmail(email.toLowerCase())
    if (!(user instanceof User)) {
      throw new NotFoundException(EmailIsWrong)
    }

    if (user.role === Role.MANAGER) {
      throw new UnauthorizedException(IsnotManager)
    }
    await ComparePassword(password, user?.password)
    const token = await this.generateToken.jwt(user?.email, user?.id)
    const userCacheKey = `user:${email}`
    await this.redisService.set(userCacheKey, { user, token })

    return { user, token }
  }
}
