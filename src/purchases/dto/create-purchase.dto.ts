import { IsUUID, IsNumber, Min } from 'class-validator';

export class CreatePurchaseDto {
  @IsUUID()
  sale_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}
