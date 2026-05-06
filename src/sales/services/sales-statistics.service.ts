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
          COUNT(CASE WHEN status = 'available' THEN 1 END) as active_listings,
          SUM(price * quantity) as total_revenue,
          AVG(price * quantity) as average_sale_price,
          AVG(
            CASE
              WHEN completed_at IS NOT NULL
              THEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600
              ELSE NULL
            END
          ) as average_time_to_sell,
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / NULLIF(COUNT(*), 0) as conversion_rate
        FROM sales
        WHERE seller_id = $1
      )
      SELECT * FROM sales_stats
    `;

    const [result] = await this.dataSource.query(query, [userId]);
    return {
      active_listings: parseInt(result.active_listings) || 0,
      completed_sales: parseInt(result.completed_sales) || 0,
      cancelled_sales: parseInt(result.cancelled_sales) || 0,
      total_sales: parseInt(result.total_sales) || 0,
      total_revenue: parseFloat(result.total_revenue) || 0,
      average_sale_price: parseFloat(result.average_sale_price) || 0,
      average_time_to_sell: parseFloat(result.average_time_to_sell) || 0,
      conversion_rate: (parseFloat(result.conversion_rate) || 0) * 100,
    };
  }

  private async getPurchaseMetrics(userId: string) {
    const query = `
      WITH purchase_stats AS (
        SELECT
          COUNT(*) as total_orders,
          SUM(price * quantity) as total_spent,
          AVG(price * quantity) as average_order_value
        FROM purchases
        WHERE user_id = $1
      ),
      category_preferences AS (
        SELECT
          c.id as category_id,
          c.name as category_name,
          COUNT(*) as purchase_count,
          SUM(p.price * p.quantity) as total_spent
        FROM purchases p
        JOIN categories c ON c.id = p.category_id
        WHERE p.user_id = $1
        GROUP BY c.id, c.name
        ORDER BY purchase_count DESC
        LIMIT 5
      )
      SELECT
        ps.*,
        COALESCE(json_agg(
          jsonb_build_object(
            'category_id', cp.category_id,
            'category_name', cp.category_name,
            'purchase_count', cp.purchase_count,
            'total_spent', cp.total_spent
          )
        ) FILTER (WHERE cp.category_id IS NOT NULL), '[]'::json) as favorite_categories
      FROM purchase_stats ps
      LEFT JOIN category_preferences cp ON true
      GROUP BY ps.total_orders, ps.total_spent, ps.average_order_value
    `;

    const [result] = await this.dataSource.query(query, [userId]);
    return {
      total_orders: parseInt(result.total_orders) || 0,
      total_spent: parseFloat(result.total_spent) || 0,
      average_order_value: parseFloat(result.average_order_value) || 0,
      favorite_categories: result.favorite_categories || [],
    };
  }

  private async getActivityMetrics(userId: string) {
    const query = `
      WITH activity_stats AS (
        SELECT
          GREATEST(
            COALESCE(MAX(s.created_at), 'epoch'::timestamp),
            COALESCE((SELECT MAX(p.created_at) FROM purchases p WHERE p.user_id = $1), 'epoch'::timestamp)
          ) as last_activity,
          AVG(EXTRACT(EPOCH FROM (reserved_at - created_at))/3600) as average_response_time,
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / NULLIF(COUNT(*), 0) as completion_rate,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::float / NULLIF(COUNT(*), 0) as cancellation_rate
        FROM sales s
        WHERE s.seller_id = $1 OR s.buyer_id = $1
      )
      SELECT * FROM activity_stats
    `;

    const [result] = await this.dataSource.query(query, [userId]);
    return {
      last_activity: result.last_activity ? new Date(result.last_activity) : new Date(0),
      average_response_time: parseFloat(result.average_response_time) || 0,
      completion_rate: (parseFloat(result.completion_rate) || 0) * 100,
      cancellation_rate: (parseFloat(result.cancellation_rate) || 0) * 100,
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
        COALESCE(json_agg(
          jsonb_build_object(
            'date', date,
            'count', sales_count,
            'revenue', sales_revenue
          )
        ), '[]'::json) as daily_sales,
        COALESCE(json_agg(
          jsonb_build_object(
            'date', date,
            'count', purchase_count,
            'spent', purchase_spent
          )
        ), '[]'::json) as daily_purchases
      FROM daily_stats
    `;

    const [result] = await this.dataSource.query(query, [userId]);
    return {
      daily_sales: (result.daily_sales || []).map(item => ({
        date: new Date(item.date).toISOString().split('T')[0],
        count: parseInt(item.count),
        revenue: parseFloat(item.revenue) || 0,
      })),
      daily_purchases: (result.daily_purchases || []).map(item => ({
        date: new Date(item.date).toISOString().split('T')[0],
        count: parseInt(item.count),
        spent: parseFloat(item.spent) || 0,
      })),
    };
  }

  private async getAverageRating(userId: string): Promise<number> {
    const query = `
      WITH store_ids AS (
        SELECT id FROM stores WHERE user_id = $1
      ),
      ratings AS (
        SELECT ur.rating::float AS rating
        FROM userratings ur
        WHERE ur.user_id = $1
        UNION ALL
        SELECT sr.rating::float AS rating
        FROM storeratings sr
        WHERE sr.store_id IN (SELECT id FROM store_ids)
      )
      SELECT AVG(rating) as average_rating
      FROM ratings
    `;

    const [result] = await this.dataSource.query(query, [userId]);
    return parseFloat(result.average_rating) || 0;
  }
} 
