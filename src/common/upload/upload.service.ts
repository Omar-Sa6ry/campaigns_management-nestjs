import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { UploadApiResponse } from 'cloudinary'
import { ConfigService } from '@nestjs/config'
import { CreateImagDto } from './dtos/createImage.dto'
import { configureCloudinary } from './config/cloudinary'
import { v2 as cloudinary } from 'cloudinary'

@Injectable()
export class UploadService {
  constructor (private configService: ConfigService) {
    configureCloudinary(this.configService)
  }

  async uploadMedia(
    createImageInput: CreateImagDto,
    dirUpload: string = 'avatars',
  ): Promise<string> {
    try {
      const { createReadStream, filename, mimetype } = await createImageInput.image

      if (!createReadStream || typeof createReadStream !== 'function') {
        throw new HttpException('Invalid file input', HttpStatus.BAD_REQUEST)
      }

      const stream = createReadStream()

      const resourceType = mimetype.startsWith('video') ? 'video' : 'image'

      console.log(`Uploading ${resourceType}...`)

      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: dirUpload,
            public_id: `${Date.now()}-${filename}`,
            resource_type: resourceType, // This will change based on the file type
          },
          (error, result) => {
            if (error) {
              console.error(`${resourceType} Upload Error:`, error)
              reject(
                new HttpException(
                  `${resourceType} upload failed`,
                  HttpStatus.BAD_REQUEST,
                ),
              )
            } else {
              resolve(result)
            }
          },
        )

        stream.pipe(uploadStream)
      })

      if (!result || !result.secure_url) {
        throw new HttpException(
          'Cloudinary response invalid',
          HttpStatus.BAD_REQUEST,
        )
      }

      console.log(`${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} upload successful:`, result.secure_url)
      return result.secure_url
    } catch (error) {
      console.error('Upload Error:', error)
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async deleteMedia(publicId: string): Promise<void> {
    try {
      console.log('Deleting media with public_id:', publicId)

      const result = await cloudinary.uploader.destroy(publicId)
      if (result.result !== 'ok') {
        throw new HttpException('Media deletion failed', HttpStatus.BAD_REQUEST)
      }

      console.log('Media deleted successfully')
    } catch (error) {
      console.error('Delete Error:', error)
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}