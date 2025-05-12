import { IsString, IsOptional, IsUUID, IsInt, Min, Max } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsUUID()
  sale_id?: string;

  @IsOptional()
  @IsUUID()
  store_id?: string;

  @IsOptional()
  @IsUUID()
  target_user_id?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}