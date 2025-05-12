import { IsInt, IsString, IsUUID, Min, Max } from 'class-validator';

export class CreateStoreRatingDto {
  @IsUUID()
  store_id: string; // ID de la tienda que recibe el rating

  @IsUUID()
  sale_id: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  comment?: string; // Comentario opcional
}
