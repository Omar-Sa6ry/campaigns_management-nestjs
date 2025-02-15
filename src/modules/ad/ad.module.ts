import { Module } from '@nestjs/common'
import { AdService } from './ad.service'
import { AdResolver } from './ad.resolver'
import { Ad } from './entity/ad.entity'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [TypeOrmModule.forFeature([Ad])],
  providers: [AdService, AdResolver],
})
export class AdModule {}
