import { HistoryItemType } from '../dto/sales-history-filter.dto';

export interface HistoryItem {
  id: string;
  type: HistoryItemType;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image_url: string;
  status: string;
  category_id: string;
  language_id: string;
  seller_id: string;
  buyer_id: string;
  store_id: string | null;
  created_at: Date;
  updated_at: Date;
  cancelled_at: Date | null;
  completed_at: Date | null;
  cancellation_reason: string | null;
  category?: {
    id: string;
    name: string;
    description: string;
    image_url: string;
  } | null;
  language?: {
    id: string;
    name: string;
    code: string;
    flag_url: string;
  } | null;
  seller?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string;
    is_pro: boolean;
  } | null;
  buyer?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string;
    is_pro: boolean;
  } | null;
  store?: {
    id: string;
    name: string;
    description: string;
    logo_url: string;
    banner_url: string;
  } | null;
} 