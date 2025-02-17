import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UploadService } from './upload.service'
import { UploadResolver } from './upload.resolver'
import { Image } from './entity/image.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Image])],
  providers: [UploadService, UploadResolver],
  exports: [UploadService],
})
export class UploadModule {}
