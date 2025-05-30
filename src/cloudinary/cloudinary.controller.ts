import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Body, Patch, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CloudinaryService } from './cloudinary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Delete, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { EnvConfig } from 'src/config/env.config';

@ApiTags('cloudinary')
@ApiBearerAuth()
@Controller('cloudinary')
@UseGuards(JwtAuthGuard)
export class CloudinaryController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly usersService: UsersService,
  ) {}

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
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or file type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      return { message: 'File is required' };
    }
    if (!file.mimetype.startsWith('image/')) {
      return { message: 'Only image files are allowed' };
    }
    const result = await this.cloudinaryService.uploadImage(file, folder);
    return {
      message: 'Image uploaded successfully',
      data: result,
    };
  }

  @Delete('delete')
  @ApiOperation({ summary: 'Delete an image from Cloudinary' })
  @ApiQuery({ name: 'publicId', required: true, description: 'Cloudinary public ID of the image' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ status: 400, description: 'Missing or invalid publicId' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteImage(@Query('publicId') publicId: string) {
    if (!publicId) {
      return { message: 'publicId is required' };
    }
    const result = await this.cloudinaryService.deleteImage(publicId);
    return {
      message: 'Image deleted successfully',
      data: result,
    };
  }

  @Patch('avatar')
  @ApiOperation({ summary: 'Upload and set user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Avatar updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or file type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      return { message: 'File is required' };
    }
    if (!file.mimetype.startsWith('image/')) {
      return { message: 'Only image files are allowed' };
    }

    // Get the current user
    const user = await this.usersService.findOne(req.user.id);

    // Update the avatar using the new method
    const result: any = await this.cloudinaryService.updateImage(
      file,
      user.avatar_url || null,
      'Beyond TCG/avatars'
    );

    // Update user's avatar URL
    await this.usersService.update(req.user.id, { avatar_url: result.secure_url });

    return {
      message: 'Avatar updated successfully',
      avatar_url: result.secure_url,
    };
  }
}