import { ApiProperty } from '@nestjs/swagger';
import { SaleStatus } from '../entities/sale.entity';

export class SalesMetricsDto {
  @ApiProperty({ description: 'Total number of sales' })
  total_sales: number;

  @ApiProperty({ description: 'Total revenue from all sales' })
  total_revenue: number;

  @ApiProperty({ description: 'Average sale price' })
  average_sale_price: number;

  @ApiProperty({ description: 'Average sales per day' })
  average_sales_per_day: number;

  @ApiProperty({ description: 'Conversion rate (completed sales / total sales)' })
  conversion_rate: number;

  @ApiProperty({ description: 'Sales by status' })
  sales_by_status: Record<SaleStatus, number>;

  @ApiProperty({ description: 'Sales by period' })
  sales_by_period: {
    today: number;
    yesterday: number;
    this_week: number;
    last_week: number;
    this_month: number;
    last_month: number;
  };

  @ApiProperty({ description: 'Revenue by period' })
  revenue_by_period: {
    today: number;
    yesterday: number;
    this_week: number;
    last_week: number;
    this_month: number;
    last_month: number;
  };

  @ApiProperty({ description: 'Shipping metrics' })
  shipping_metrics: {
    total_shipped: number;
    total_delivered: number;
    average_shipping_time: number; // in hours
    delivery_success_rate: number;
  };

  @ApiProperty({ description: 'Category performance' })
  category_performance: Array<{
    category_id: string;
    category_name: string;
    total_sales: number;
    total_revenue: number;
    average_price: number;
  }>;

  @ApiProperty({ description: 'Store performance' })
  store_performance: Array<{
    store_id: string;
    store_name: string;
    total_sales: number;
    total_revenue: number;
    average_price: number;
  }>;
} 