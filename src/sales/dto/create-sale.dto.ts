import { IsString, IsNumber, IsOptional, IsUUID, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { SaleStatus } from '../entities/sale.entity';

export class CreateSaleDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  image_url?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @IsUUID()
  category_id: string;

  @IsUUID()
  language_id: string;

  @IsOptional()
  @IsUUID()
  store_id?: string;
}
