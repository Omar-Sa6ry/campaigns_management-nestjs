import { Module } from '@nestjs/common'
import { PartnerResolver } from './partner.resolver'
import { PartnerService } from './partner.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Partner } from './entity/partner.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Partner])],
  providers: [PartnerResolver, PartnerService],
})
export class PartnerModule {}
