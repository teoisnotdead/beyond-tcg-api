import { IsOptional, IsEnum, IsString, IsUUID, IsDateString, IsNumber, Min, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { SaleStatus } from '../entities/sale.entity';

export enum HistoryItemType {
  SALE = 'sale',
  CANCELLED_SALE = 'cancelled_sale',
  PURCHASE = 'purchase'
}

export class SalesHistoryFilterDto {
  @IsOptional()
  @IsEnum(HistoryItemType)
  type?: HistoryItemType;

  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @IsUUID()
  language_id?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  types?: HistoryItemType[];
} 