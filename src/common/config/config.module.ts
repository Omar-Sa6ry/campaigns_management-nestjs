import { Module } from '@nestjs/common'
import { ConfigModule as config } from '@nestjs/config'

@Module({
  imports: [
    config.forRoot({
      cache: true,
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
})
export class ConfigModule {}
