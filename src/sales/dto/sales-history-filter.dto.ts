import { IsOptional, IsEnum, IsString, IsUUID, IsDateString, IsNumber, Min, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { SaleStatus } from '../entities/sale.entity';

export enum HistoryItemType {
  SALE = 'sale',
  CANCELLED_SALE = 'cancelled_sale',
  PURCHASE = 'purchase'
}

export enum SortField {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  PRICE = 'price',
  QUANTITY = 'quantity',
  STATUS = 'status'
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC'
}

export class SalesHistoryFilterDto {
  @IsOptional()
  @IsEnum(HistoryItemType)
  type?: HistoryItemType;

  @IsOptional()
  @IsArray()
  @IsEnum(HistoryItemType, { each: true })
  types?: HistoryItemType[];

  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @IsOptional()
  @IsArray()
  @IsEnum(SaleStatus, { each: true })
  statuses?: SaleStatus[];

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  category_ids?: string[];

  @IsOptional()
  @IsUUID()
  language_id?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  language_ids?: string[];

  @IsOptional()
  @IsUUID()
  store_id?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  store_ids?: string[];

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_quantity?: number;

  @IsOptional()
  @IsBoolean()
  has_shipping_proof?: boolean;

  @IsOptional()
  @IsBoolean()
  has_delivery_proof?: boolean;

  @IsOptional()
  @IsEnum(SortField)
  sort_by?: SortField = SortField.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sort_order?: SortOrder = SortOrder.DESC;

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
} 