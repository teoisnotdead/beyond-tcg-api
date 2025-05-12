import { IsUUID } from 'class-validator';

export class CreateFavoriteDto {
  @IsUUID()
  sale_id: string;
} 