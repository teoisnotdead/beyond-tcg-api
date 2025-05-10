import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLanguageDto {
  @ApiProperty({ description: 'Language code (e.g., en, es, fr)' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Language name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Language status', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 