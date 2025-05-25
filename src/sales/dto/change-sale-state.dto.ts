import { IsUUID, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReserveSaleDto {
  @ApiProperty({ description: 'ID of the sale to reserve' })
  @IsUUID()
  @IsNotEmpty()
  saleId: string;

  @ApiProperty({ description: 'ID of the buyer' })
  @IsUUID()
  @IsNotEmpty()
  buyerId: string;

  @ApiProperty({ description: 'Quantity to reserve', required: false })
  @IsOptional()
  quantity?: number;
}

export class ShipSaleDto {
  @ApiProperty({ description: 'ID of the sale to ship' })
  @IsUUID()
  @IsNotEmpty()
  saleId: string;

  @ApiProperty({ description: 'URL of the shipping proof' })
  @IsString()
  @IsNotEmpty()
  shippingProofUrl: string;
}

export class ConfirmDeliveryDto {
  @ApiProperty({ description: 'ID of the sale to confirm delivery' })
  @IsUUID()
  @IsNotEmpty()
  saleId: string;

  @ApiProperty({ description: 'URL of the delivery proof' })
  @IsString()
  @IsNotEmpty()
  deliveryProofUrl: string;
}

export class CancelSaleDto {
  @ApiProperty({ description: 'ID of the sale to cancel' })
  @IsUUID()
  @IsNotEmpty()
  saleId: string;

  @ApiProperty({ description: 'Reason for cancellation' })
  @IsString()
  @IsNotEmpty()
  reason: string;
} 