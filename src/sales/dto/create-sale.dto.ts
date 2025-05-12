import { IsString, IsNumber, IsOptional, IsUUID, Min, IsEnum } from 'class-validator';

export class CreateSaleDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsEnum(['available', 'sold', 'reserved'])
  status?: string;

  @IsUUID()
  category_id: string;

  @IsUUID()
  language_id: string;

  @IsOptional()
  @IsUUID()
  store_id?: string;
}
