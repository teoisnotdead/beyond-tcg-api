import { IsString, IsNumber, IsOptional, IsUUID, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SaleStatus } from '../entities/sale.entity';

export class UpdateSaleDto {
  @ApiPropertyOptional({ example: 'Son Goku - FB04-129' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Championship 2025-2026 Finals - Tournament and Championship Promos' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 2300000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(99999999.99)
  price?: number;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/.../image.jpg' })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ enum: SaleStatus, example: SaleStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @ApiPropertyOptional({ example: '12434e92-5bf0-4134-996d-0e0a6aea63d7', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ example: '13f2dd1e-7e7b-4220-b64c-eac607ec8e60', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  language_id?: string;

  @ApiPropertyOptional({ example: '0363c29f-c883-436f-a0d2-36227207024e', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  store_id?: string;
}
