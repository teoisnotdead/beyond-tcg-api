import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Sale } from '../../sales/entities/sale.entity';
import { Category } from '../../categories/entities/category.entity';
import { Language } from '../../languages/entities/language.entity';

export class UserBasicInfoDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User name' })
  name: string;

  @ApiProperty({ description: 'User avatar URL', required: false })
  avatar_url?: string;
}

export class SaleBasicInfoDto {
  @ApiProperty({ description: 'Sale ID' })
  id: string;

  @ApiProperty({ description: 'Current sale status' })
  status: string;

  @ApiProperty({ description: 'Remaining quantity in sale' })
  remaining_quantity: number;

  @ApiProperty({ description: 'Sale creation date' })
  created_at: Date;
}

export class PurchaseDetailDto {
  @ApiProperty({ description: 'Purchase ID' })
  id: string;

  @ApiProperty({ description: 'Buyer information' })
  user: UserBasicInfoDto;

  @ApiProperty({ description: 'Seller information' })
  seller: UserBasicInfoDto;

  @ApiProperty({ description: 'Basic sale information' })
  sale: SaleBasicInfoDto;

  @ApiProperty({ description: 'Product name' })
  name: string;

  @ApiProperty({ description: 'Product description' })
  description: string;

  @ApiProperty({ description: 'Unit price' })
  price: number;

  @ApiProperty({ description: 'Purchased quantity' })
  quantity: number;

  @ApiProperty({ description: 'Total price (unit price * quantity)' })
  total_price: number;

  @ApiProperty({ description: 'Product image URL', required: false })
  image_url?: string;

  @ApiProperty({ description: 'Product category' })
  category: Category;

  @ApiProperty({ description: 'Product language' })
  language: Language;

  @ApiProperty({ description: 'Purchase date' })
  created_at: Date;

  @ApiProperty({ description: 'Shipping status', required: false })
  shipping_status?: string;

  @ApiProperty({ description: 'Shipping proof URL', required: false })
  shipping_proof_url?: string;

  @ApiProperty({ description: 'Shipping date', required: false })
  shipped_at?: Date;

  @ApiProperty({ description: 'Delivery proof URL', required: false })
  delivery_proof_url?: string;

  @ApiProperty({ description: 'Delivery date', required: false })
  delivered_at?: Date;

  @ApiProperty({ description: 'Completion date', required: false })
  completed_at?: Date;
} 