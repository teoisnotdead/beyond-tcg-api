import { Injectable } from '@nestjs/common';
import { v2 } from 'cloudinary';
import { EnvConfig } from '../config/env.config';

@Injectable()
export class CloudinaryService {
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

  /**
   * Extracts the public_id from a Cloudinary URL
   * @param url Cloudinary image URL
   * @returns public_id or null
   */
  extractPublicId(url: string): string | null {
    if (!url) return null;
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    let publicId = parts[1].replace(/^v\d+\//, ''); // remove version
    publicId = publicId.replace(/\.(jpg|jpeg|png|webp)$/, ''); // remove extension
    return publicId;
  }

  /**
   * Updates an image by deleting the old one and uploading the new one
   * @param file New image file
   * @param oldImageUrl URL of the old image to delete
   * @param folder Folder where the new image will be stored
   * @returns The result of the upload operation
   */
  async updateImage(
    file: Express.Multer.File,
    oldImageUrl: string | null,
    folder: string = 'general',
  ) {
    // Delete old image if it exists and is not the default avatar
    if (oldImageUrl && oldImageUrl !== EnvConfig().cloudinary.defaultAvatarUrl) {
      const publicId = this.extractPublicId(oldImageUrl);
      if (publicId) {
        await this.deleteImage(publicId);
      }
    }

    // Upload new image
    return this.uploadImage(file, folder);
  }
} 