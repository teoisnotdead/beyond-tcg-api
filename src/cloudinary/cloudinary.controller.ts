import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CloudinaryService } from './cloudinary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('cloudinary')
@ApiBearerAuth()
@Controller('cloudinary')
@UseGuards(JwtAuthGuard)
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          description: 'Folder where the image will be stored (default: general)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    const result = await this.cloudinaryService.uploadImage(file, folder);
    return {
      message: 'Image uploaded successfully',
      data: result,
    };
  }
} 