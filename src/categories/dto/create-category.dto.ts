import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Nombre de la categoría' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Descripción de la categoría', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Estado de la categoría', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 