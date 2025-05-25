import { IsString, IsNumber, IsOptional, IsUUID, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { SaleStatus } from '../entities/sale.entity';

export class UpdateSaleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @IsUUID()
  language_id?: string;

  @IsOptional()
  @IsUUID()
  store_id?: string;
} 