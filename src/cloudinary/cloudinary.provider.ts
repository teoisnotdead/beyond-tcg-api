import { v2 } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return v2.config({
      cloud_name: configService.get('cloudinary.cloudName'),
      api_key: configService.get('cloudinary.apiKey'),
      api_secret: configService.get('cloudinary.apiSecret'),
    });
  },
}; 