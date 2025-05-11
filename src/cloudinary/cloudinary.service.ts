import { Injectable } from '@nestjs/common';
import { v2 } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {}

  async uploadImage(file: Express.Multer.File, folder: string = 'general') {
    return new Promise((resolve, reject) => {
      const upload = v2.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      upload.end(file.buffer);
    });
  }

  async deleteImage(publicId: string) {
    return new Promise((resolve, reject) => {
      v2.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }
} 