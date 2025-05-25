import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale, SaleStatus } from '../entities/sale.entity';

export interface UserStatistics {
  // Métricas generales
  total_sales: number;
  total_purchases: number;
  total_revenue: number;
  total_spent: number;
  average_rating: number;
  
  // Métricas de ventas
  sales_metrics: {
    active_listings: number;
    completed_sales: number;
    cancelled_sales: number;
    average_sale_price: number;
    average_time_to_sell: number; // en horas
    conversion_rate: number;
  };

  // Métricas de compras
  purchase_metrics: {
    total_orders: number;
    average_order_value: number;
    favorite_categories: Array<{
      category_id: string;
      category_name: string;
      purchase_count: number;
      total_spent: number;
    }>;
  };

  // Métricas de actividad
  activity_metrics: {
    last_activity: Date;
    average_response_time: number; // en horas
    completion_rate: number;
    cancellation_rate: number;
  };

  // Tendencias recientes
  recent_trends: {
    daily_sales: Array<{
      date: string;
      count: number;
      revenue: number;
    }>;
    daily_purchases: Array<{
      date: string;
      count: number;
      spent: number;
    }>;
  };
}

@Injectable()
export class SalesStatisticsService {
  constructor(
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    private readonly dataSource: DataSource,
  ) {}

  async getUserStatistics(userId: string): Promise<UserStatistics> {
    const [salesMetrics, purchaseMetrics, activityMetrics, recentTrends] = await Promise.all([
      this.getSalesMetrics(userId),
      this.getPurchaseMetrics(userId),
      this.getActivityMetrics(userId),
      this.getRecentTrends(userId),
    ]);

    return {
      total_sales: salesMetrics.total_sales,
      total_purchases: purchaseMetrics.total_orders,
      total_revenue: salesMetrics.total_revenue,
      total_spent: purchaseMetrics.total_spent,
      average_rating: await this.getAverageRating(userId),
      sales_metrics: salesMetrics,
      purchase_metrics: purchaseMetrics,
      activity_metrics: activityMetrics,
      recent_trends: recentTrends,
    };
  }

  private async getSalesMetrics(userId: string) {
    const query = `
      WITH sales_stats AS (
        SELECT
          COUNT(*) as total_sales,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sales,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_sales,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_listings,
          SUM(price * quantity) as total_revenue,
          AVG(price * quantity) as average_sale_price,
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as average_time_to_sell,
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / NULLIF(COUNT(*), 0) as conversion_rate
        FROM sales
        WHERE seller_id = $1
      )
      SELECT * FROM sales_stats
    `;

    const [result] = await this.dataSource.query(query, [userId]);
    return {
      active_listings: parseInt(result.active_listings),
      completed_sales: parseInt(result.completed_sales),
      cancelled_sales: parseInt(result.cancelled_sales),
      total_sales: parseInt(result.total_sales),
      total_revenue: parseFloat(result.total_revenue),
      average_sale_price: parseFloat(result.average_sale_price),
      average_time_to_sell: parseFloat(result.average_time_to_sell),
      conversion_rate: parseFloat(result.conversion_rate) * 100,
    };
  }

  private async getPurchaseMetrics(userId: string) {
    const query = `
      WITH purchase_stats AS (
        SELECT
          COUNT(*) as total_orders,
          SUM(price * quantity) as total_spent,
          AVG(price * quantity) as average_order_value
        FROM sales
        WHERE buyer_id = $1
      ),
      category_preferences AS (
        SELECT
          c.id as category_id,
          c.name as category_name,
          COUNT(*) as purchase_count,
          SUM(s.price * s.quantity) as total_spent
        FROM sales s
        JOIN categories c ON c.id = s.category_id
        WHERE s.buyer_id = $1
        GROUP BY c.id, c.name
        ORDER BY purchase_count DESC
        LIMIT 5
      )
      SELECT
        ps.*,
        json_agg(
          jsonb_build_object(
            'category_id', cp.category_id,
            'category_name', cp.category_name,
            'purchase_count', cp.purchase_count,
            'total_spent', cp.total_spent
          )
        ) as favorite_categories
      FROM purchase_stats ps
      CROSS JOIN category_preferences cp
      GROUP BY ps.total_orders, ps.total_spent, ps.average_order_value
    `;

    const [result] = await this.dataSource.query(query, [userId]);
    return {
      total_orders: parseInt(result.total_orders),
      total_spent: parseFloat(result.total_spent),
      average_order_value: parseFloat(result.average_order_value),
      favorite_categories: result.favorite_categories,
    };
  }

  private async getActivityMetrics(userId: string) {
    const query = `
      WITH activity_stats AS (
        SELECT
          MAX(updated_at) as last_activity,
          AVG(EXTRACT(EPOCH FROM (reserved_at - created_at))/3600) as average_response_time,
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / NULLIF(COUNT(*), 0) as completion_rate,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::float / NULLIF(COUNT(*), 0) as cancellation_rate
        FROM sales
        WHERE seller_id = $1 OR buyer_id = $1
      )
      SELECT * FROM activity_stats
    `;

    const [result] = await this.dataSource.query(query, [userId]);
    return {
      last_activity: new Date(result.last_activity),
      average_response_time: parseFloat(result.average_response_time),
      completion_rate: parseFloat(result.completion_rate) * 100,
      cancellation_rate: parseFloat(result.cancellation_rate) * 100,
    };
  }

  private async getRecentTrends(userId: string) {
    const query = `
      WITH daily_stats AS (
        SELECT
          DATE_TRUNC('day', created_at) as date,
          COUNT(CASE WHEN seller_id = $1 THEN 1 END) as sales_count,
          SUM(CASE WHEN seller_id = $1 THEN price * quantity ELSE 0 END) as sales_revenue,
          COUNT(CASE WHEN buyer_id = $1 THEN 1 END) as purchase_count,
          SUM(CASE WHEN buyer_id = $1 THEN price * quantity ELSE 0 END) as purchase_spent
        FROM sales
        WHERE (seller_id = $1 OR buyer_id = $1)
          AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date DESC
      )
      SELECT
        json_agg(
          jsonb_build_object(
            'date', date,
            'count', sales_count,
            'revenue', sales_revenue
          )
        ) as daily_sales,
        json_agg(
          jsonb_build_object(
            'date', date,
            'count', purchase_count,
            'spent', purchase_spent
          )
        ) as daily_purchases
      FROM daily_stats
    `;

    const [result] = await this.dataSource.query(query, [userId]);
    return {
      daily_sales: result.daily_sales.map(item => ({
        date: new Date(item.date).toISOString().split('T')[0],
        count: parseInt(item.count),
        revenue: parseFloat(item.revenue),
      })),
      daily_purchases: result.daily_purchases.map(item => ({
        date: new Date(item.date).toISOString().split('T')[0],
        count: parseInt(item.count),
        spent: parseFloat(item.spent),
      })),
    };
  }

  private async getAverageRating(userId: string): Promise<number> {
    const query = `
      SELECT AVG(rating) as average_rating
      FROM sales
      WHERE (seller_id = $1 OR buyer_id = $1)
        AND rating IS NOT NULL
    `;

    const [result] = await this.dataSource.query(query, [userId]);
    return parseFloat(result.average_rating) || 0;
  }
} 