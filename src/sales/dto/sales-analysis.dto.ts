import { ApiProperty } from '@nestjs/swagger';
import { SaleStatus } from '../entities/sale.entity';

export class SalesAnalysisDto {
  @ApiProperty({ description: 'Análisis de tendencias de ventas' })
  trends: {
    sales_trend: {
      period: string;
      current_value: number;
      previous_value: number;
      percentage_change: number;
      trend_direction: 'up' | 'down' | 'stable';
    };
    revenue_trend: {
      period: string;
      current_value: number;
      previous_value: number;
      percentage_change: number;
      trend_direction: 'up' | 'down' | 'stable';
    };
    average_price_trend: {
      period: string;
      current_value: number;
      previous_value: number;
      percentage_change: number;
      trend_direction: 'up' | 'down' | 'stable';
    };
  };

  @ApiProperty({ description: 'Análisis de precios' })
  price_analysis: {
    price_distribution: {
      range: string;
      count: number;
      percentage: number;
    }[];
    average_price_by_category: Array<{
      category_id: string;
      category_name: string;
      average_price: number;
      min_price: number;
      max_price: number;
      price_standard_deviation: number;
    }>;
    price_correlation: {
      price_vs_sales: number; // correlación entre precio y número de ventas
      price_vs_conversion: number; // correlación entre precio y tasa de conversión
    };
  };

  @ApiProperty({ description: 'Análisis de categorías' })
  category_analysis: {
    category_growth: Array<{
      category_id: string;
      category_name: string;
      current_period_sales: number;
      previous_period_sales: number;
      growth_rate: number;
    }>;
    category_diversity: {
      total_categories: number;
      active_categories: number;
      category_concentration: number; // índice de concentración (0-1)
      top_categories_share: number; // porcentaje de ventas de las top 3 categorías
    };
    category_performance: Array<{
      category_id: string;
      category_name: string;
      conversion_rate: number;
      average_time_to_sell: number; // en horas
      return_rate: number; // porcentaje de ventas canceladas
    }>;
  };

  @ApiProperty({ description: 'Análisis de comportamiento de usuarios' })
  user_behavior: {
    seller_metrics: {
      average_listing_time: number; // tiempo promedio hasta vender
      average_response_time: number; // tiempo promedio de respuesta
      completion_rate: number; // tasa de ventas completadas
      cancellation_rate: number; // tasa de cancelaciones
    };
    buyer_metrics: {
      average_purchase_value: number;
      purchase_frequency: number; // compras por período
      category_preference: Array<{
        category_id: string;
        category_name: string;
        purchase_count: number;
        total_spent: number;
      }>;
    };
    interaction_metrics: {
      average_views_per_listing: number;
      average_offers_per_listing: number;
      conversion_by_time_of_day: Array<{
        hour: number;
        conversion_rate: number;
      }>;
    };
  };
}

export class SalesAnalysisFilterDto {
  @ApiProperty({ required: false, description: 'Fecha de inicio del análisis (ISO format)' })
  start_date?: string;

  @ApiProperty({ required: false, description: 'Fecha de fin del análisis (ISO format)' })
  end_date?: string;

  @ApiProperty({ required: false, description: 'Período de comparación (days/weeks/months)' })
  comparison_period?: 'days' | 'weeks' | 'months';

  @ApiProperty({ required: false, description: 'Número de períodos a analizar' })
  periods?: number;

  @ApiProperty({ required: false, description: 'IDs de categorías a incluir' })
  category_ids?: string[];

  @ApiProperty({ required: false, description: 'IDs de tiendas a incluir' })
  store_ids?: string[];

  @ApiProperty({ required: false, description: 'Rango de precios mínimo' })
  min_price?: number;

  @ApiProperty({ required: false, description: 'Rango de precios máximo' })
  max_price?: number;
} 