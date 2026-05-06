import { IsString, IsNumber, IsOptional, IsUUID, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SaleStatus } from '../entities/sale.entity';

export class CreateSaleDto {
  @ApiProperty({ example: 'Son Goku - FB04-129' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Championship 2025-2026 Finals - Tournament and Championship Promos' })
  @IsString()
  description: string;

  @ApiProperty({ example: 2300000, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(99999999.99)
  price: number;

  @ApiProperty({ example: 'https://res.cloudinary.com/.../image.jpg' })
  @IsString()
  image_url: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ enum: SaleStatus, example: SaleStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @ApiProperty({ example: '12434e92-5bf0-4134-996d-0e0a6aea63d7', format: 'uuid' })
  @IsUUID()
  category_id: string;

  @ApiProperty({ example: '13f2dd1e-7e7b-4220-b64c-eac607ec8e60', format: 'uuid' })
  @IsUUID()
  language_id: string;

  @ApiPropertyOptional({ example: '0363c29f-c883-436f-a0d2-36227207024e', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  store_id?: string;
}
