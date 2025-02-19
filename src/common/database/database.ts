import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Ad } from 'src/modules/ad/entity/ad.entity'
import { Campaign } from 'src/modules/campaign/entity/campaign.entity'
import { Interaction } from 'src/modules/interaction/entity/interaction.entity'
import { Partner } from 'src/modules/partner/entity/partner.entity'
import { UserCampaign } from 'src/modules/userCampaign/entity/userCampaign.entity'
import { User } from 'src/modules/users/entity/user.entity'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_username'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [User, Campaign, UserCampaign, Interaction, Partner, Ad],
        synchronize: true,
        logging: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DataBaseModule {}
