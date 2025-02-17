import { Resolver, Mutation, Args } from '@nestjs/graphql'
import { UploadService } from './upload.service'
import { CreateImagDto } from './dtos/createImage.dto'
import { Image } from './entity/image.entity'
// import { UseGuards } from '@nestjs/common'
// import { AuthGuard } from '../auth/auth.guard'

@Resolver(() => Image)
export class UploadResolver {
  constructor (private readonly uploadService: UploadService) {}

  //   @UseGuards(AuthGuard)
  @Mutation(() => String, { name: 'uploadImage' })
  async uploadImage (
    @Args('createImageInput') createImageInput: CreateImagDto,
    @Args('dirUpload', { nullable: true, defaultValue: 'avatars' })
    dirUpload: string,
  ): Promise<string> {
    return this.uploadService.uploadMedia(createImageInput, dirUpload)
  }
}
