import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum PurchaseSortField {
  CREATED_AT = 'created_at',
  PRICE = 'price',
  QUANTITY = 'quantity',
  NAME = 'name'
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC'
}

export class FindPurchasesDto {
  @ApiPropertyOptional({ description: 'Número de página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Elementos por página', default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Buscar por nombre o descripción' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por categoría' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por idioma' })
  @IsOptional()
  @IsString()
  languageId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por fecha de inicio' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filtrar por fecha de fin' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filtrar por precio mínimo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Filtrar por precio máximo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ 
    description: 'Campo por el cual ordenar',
    enum: PurchaseSortField,
    default: PurchaseSortField.CREATED_AT
  })
  @IsOptional()
  @IsEnum(PurchaseSortField)
  sortBy?: PurchaseSortField = PurchaseSortField.CREATED_AT;

  @ApiPropertyOptional({ 
    description: 'Orden de clasificación',
    enum: SortOrder,
    default: SortOrder.DESC
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
} 