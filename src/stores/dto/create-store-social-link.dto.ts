import { IsString } from 'class-validator';

export class CreateStoreSocialLinkDto {
  @IsString()
  platform: string; // Ej: 'facebook', 'twitter', 'instagram', 'email'

  @IsString()
  url: string;
}
