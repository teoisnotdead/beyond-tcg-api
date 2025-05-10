import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLanguageDto {
  @ApiProperty({ description: 'Language name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Language slug' })
  @IsString()
  slug: string;

  @ApiProperty({ description: 'Language status', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Display order', default: 0 })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;
} 