import { IsInt, IsString, IsUUID, Min, Max } from 'class-validator';

export class CreateUserRatingDto {
  @IsUUID()
  user_id: string; // ID del usuario que recibe el rating

  @IsUUID()
  sale_id: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  comment?: string; // Comentario opcional
}
