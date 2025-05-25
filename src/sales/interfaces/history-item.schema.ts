import { ApiProperty } from '@nestjs/swagger';
import { HistoryItemType } from '../dto/sales-history-filter.dto';

export class HistoryItemSchema {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ enum: HistoryItemType })
  type: HistoryItemType;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  description: string;

  @ApiProperty({ type: Number })
  price: number;

  @ApiProperty({ type: Number })
  quantity: number;

  @ApiProperty({ type: String, nullable: true })
  image_url: string;

  @ApiProperty({ type: String })
  status: string;

  @ApiProperty({ type: String })
  category_id: string;

  @ApiProperty({ type: String })
  language_id: string;

  @ApiProperty({ type: String })
  seller_id: string;

  @ApiProperty({ type: String })
  buyer_id: string;

  @ApiProperty({ type: String, nullable: true })
  store_id: string | null;

  @ApiProperty({ type: Date })
  created_at: Date;

  @ApiProperty({ type: Date })
  updated_at: Date;

  @ApiProperty({ type: Date, nullable: true })
  cancelled_at: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  completed_at: Date | null;

  @ApiProperty({ type: String, nullable: true })
  cancellation_reason: string | null;

  @ApiProperty({
    type: 'object',
    nullable: true,
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      image_url: { type: 'string' }
    }
  })
  category?: {
    id: string;
    name: string;
    description: string;
    image_url: string;
  } | null;

  @ApiProperty({
    type: 'object',
    nullable: true,
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      code: { type: 'string' },
      flag_url: { type: 'string' }
    }
  })
  language?: {
    id: string;
    name: string;
    code: string;
    flag_url: string;
  } | null;

  @ApiProperty({
    type: 'object',
    nullable: true,
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
      avatar_url: { type: 'string' },
      is_pro: { type: 'boolean' }
    }
  })
  seller?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string;
    is_pro: boolean;
  } | null;

  @ApiProperty({
    type: 'object',
    nullable: true,
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
      avatar_url: { type: 'string' },
      is_pro: { type: 'boolean' }
    }
  })
  buyer?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string;
    is_pro: boolean;
  } | null;

  @ApiProperty({
    type: 'object',
    nullable: true,
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      logo_url: { type: 'string' },
      banner_url: { type: 'string' }
    }
  })
  store?: {
    id: string;
    name: string;
    description: string;
    logo_url: string;
    banner_url: string;
  } | null;
} 