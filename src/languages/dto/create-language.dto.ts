import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLanguageDto {
  @ApiProperty({ description: 'Código del idioma (ej: es, en, fr)' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Nombre del idioma' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Estado del idioma', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 