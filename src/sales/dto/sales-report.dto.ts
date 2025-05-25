import { ApiProperty } from '@nestjs/swagger';
import { SaleStatus } from '../entities/sale.entity';

export class SalesReportDto {
  @ApiProperty({ description: 'Reporte de ventas por período' })
  period_report: {
    daily: Array<{
      date: string;
      total_sales: number;
      total_revenue: number;
      average_price: number;
    }>;
    weekly: Array<{
      week_start: string;
      week_end: string;
      total_sales: number;
      total_revenue: number;
      average_price: number;
    }>;
    monthly: Array<{
      month: string;
      total_sales: number;
      total_revenue: number;
      average_price: number;
    }>;
  };

  @ApiProperty({ description: 'Reporte de rendimiento por categoría' })
  category_report: Array<{
    category_id: string;
    category_name: string;
    total_sales: number;
    total_revenue: number;
    average_price: number;
    conversion_rate: number;
    sales_by_status: Record<SaleStatus, number>;
  }>;

  @ApiProperty({ description: 'Reporte de rendimiento por tienda' })
  store_report: Array<{
    store_id: string;
    store_name: string;
    total_sales: number;
    total_revenue: number;
    average_price: number;
    conversion_rate: number;
    sales_by_status: Record<SaleStatus, number>;
    top_categories: Array<{
      category_id: string;
      category_name: string;
      total_sales: number;
      total_revenue: number;
    }>;
  }>;

  @ApiProperty({ description: 'Reporte de estados de venta' })
  status_report: {
    by_status: Record<SaleStatus, {
      count: number;
      revenue: number;
      average_time_in_status: number; // en horas
    }>;
    status_transitions: Array<{
      from_status: SaleStatus;
      to_status: SaleStatus;
      count: number;
      average_transition_time: number; // en horas
    }>;
  };
}

export class SalesReportFilterDto {
  @ApiProperty({ required: false, description: 'Fecha de inicio del reporte (ISO format)' })
  start_date?: string;

  @ApiProperty({ required: false, description: 'Fecha de fin del reporte (ISO format)' })
  end_date?: string;

  @ApiProperty({ required: false, description: 'IDs de categorías a incluir' })
  category_ids?: string[];

  @ApiProperty({ required: false, description: 'IDs de tiendas a incluir' })
  store_ids?: string[];

  @ApiProperty({ required: false, description: 'Agrupar por día/semana/mes', enum: ['day', 'week', 'month'] })
  group_by?: 'day' | 'week' | 'month';

  @ApiProperty({ required: false, description: 'Límite de resultados para categorías/tiendas' })
  limit?: number;
} 