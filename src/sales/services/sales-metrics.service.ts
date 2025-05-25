import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale, SaleStatus } from '../entities/sale.entity';
import { Purchase } from '../../purchases/entities/purchase.entity';
import { SalesMetricsDto } from '../dto/sales-metrics.dto';

@Injectable()
export class SalesMetricsService {
  constructor(
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    @InjectRepository(Purchase)
    private readonly purchasesRepository: Repository<Purchase>,
    private readonly dataSource: DataSource,
  ) {}

  async getSalesMetrics(userId: string, startDate?: Date, endDate?: Date): Promise<SalesMetricsDto> {
    const whereClause = this.buildDateFilterClause(startDate, endDate);
    const userFilter = userId ? 'AND (s.seller_id = :userId OR s.buyer_id = :userId)' : '';
    const parameters = this.buildQueryParameters(userId, startDate, endDate);

    // Base query for all metrics
    const metricsQuery = `
      WITH sales_data AS (
        SELECT 
          s.*,
          EXTRACT(EPOCH FROM (s.delivered_at - s.shipped_at))/3600 as shipping_time_hours
        FROM sales s
        WHERE 1=1 ${whereClause} ${userFilter}
      ),
      sales_stats AS (
        SELECT
          COUNT(*) as total_sales,
          SUM(price * quantity) as total_revenue,
          AVG(price * quantity) as average_sale_price,
          COUNT(*)::float / NULLIF(DATE_PART('day', MAX(created_at) - MIN(created_at)), 0) as average_sales_per_day,
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / NULLIF(COUNT(*), 0) as conversion_rate,
          COUNT(CASE WHEN status = 'available' THEN 1 END) as available_count,
          COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved_count,
          COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_count,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
          AVG(shipping_time_hours) as average_shipping_time,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END)::float / NULLIF(COUNT(CASE WHEN status = 'shipped' THEN 1 END), 0) as delivery_success_rate
        FROM sales_data
      ),
      period_stats AS (
        SELECT
          COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_sales,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE THEN 1 END) as yesterday_sales,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as this_week_sales,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '14 days' AND created_at < CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as last_week_sales,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as this_month_sales,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '60 days' AND created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_month_sales,
          SUM(CASE WHEN created_at >= CURRENT_DATE THEN price * quantity ELSE 0 END) as today_revenue,
          SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE THEN price * quantity ELSE 0 END) as yesterday_revenue,
          SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN price * quantity ELSE 0 END) as this_week_revenue,
          SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '14 days' AND created_at < CURRENT_DATE - INTERVAL '7 days' THEN price * quantity ELSE 0 END) as last_week_revenue,
          SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN price * quantity ELSE 0 END) as this_month_revenue,
          SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '60 days' AND created_at < CURRENT_DATE - INTERVAL '30 days' THEN price * quantity ELSE 0 END) as last_month_revenue
        FROM sales_data
      ),
      category_stats AS (
        SELECT
          c.id as category_id,
          c.name as category_name,
          COUNT(*) as total_sales,
          SUM(s.price * s.quantity) as total_revenue,
          AVG(s.price * s.quantity) as average_price
        FROM sales_data s
        JOIN categories c ON c.id = s.category_id
        GROUP BY c.id, c.name
        ORDER BY total_revenue DESC
      ),
      store_stats AS (
        SELECT
          st.id as store_id,
          st.name as store_name,
          COUNT(*) as total_sales,
          SUM(s.price * s.quantity) as total_revenue,
          AVG(s.price * s.quantity) as average_price
        FROM sales_data s
        JOIN stores st ON st.id = s.store_id
        GROUP BY st.id, st.name
        ORDER BY total_revenue DESC
      )
      SELECT 
        ss.*,
        ps.*,
        cs.category_performance,
        sts.store_performance
      FROM sales_stats ss
      CROSS JOIN period_stats ps
      CROSS JOIN (
        SELECT json_agg(row_to_json(cs)) as category_performance
        FROM category_stats cs
      ) cs
      CROSS JOIN (
        SELECT json_agg(row_to_json(sts)) as store_performance
        FROM store_stats sts
      ) sts
    `;

    const [metrics] = await this.dataSource.query(metricsQuery, parameters);

    return {
      total_sales: parseInt(metrics.total_sales) || 0,
      total_revenue: parseFloat(metrics.total_revenue) || 0,
      average_sale_price: parseFloat(metrics.average_sale_price) || 0,
      average_sales_per_day: parseFloat(metrics.average_sales_per_day) || 0,
      conversion_rate: parseFloat(metrics.conversion_rate) || 0,
      sales_by_status: {
        [SaleStatus.AVAILABLE]: parseInt(metrics.available_count) || 0,
        [SaleStatus.RESERVED]: parseInt(metrics.reserved_count) || 0,
        [SaleStatus.SHIPPED]: parseInt(metrics.shipped_count) || 0,
        [SaleStatus.DELIVERED]: parseInt(metrics.delivered_count) || 0,
        [SaleStatus.COMPLETED]: parseInt(metrics.completed_count) || 0,
        [SaleStatus.CANCELLED]: parseInt(metrics.cancelled_count) || 0,
      },
      sales_by_period: {
        today: parseInt(metrics.today_sales) || 0,
        yesterday: parseInt(metrics.yesterday_sales) || 0,
        this_week: parseInt(metrics.this_week_sales) || 0,
        last_week: parseInt(metrics.last_week_sales) || 0,
        this_month: parseInt(metrics.this_month_sales) || 0,
        last_month: parseInt(metrics.last_month_sales) || 0,
      },
      revenue_by_period: {
        today: parseFloat(metrics.today_revenue) || 0,
        yesterday: parseFloat(metrics.yesterday_revenue) || 0,
        this_week: parseFloat(metrics.this_week_revenue) || 0,
        last_week: parseFloat(metrics.last_week_revenue) || 0,
        this_month: parseFloat(metrics.this_month_revenue) || 0,
        last_month: parseFloat(metrics.last_month_revenue) || 0,
      },
      shipping_metrics: {
        total_shipped: parseInt(metrics.shipped_count) || 0,
        total_delivered: parseInt(metrics.delivered_count) || 0,
        average_shipping_time: parseFloat(metrics.average_shipping_time) || 0,
        delivery_success_rate: parseFloat(metrics.delivery_success_rate) || 0,
      },
      category_performance: metrics.category_performance || [],
      store_performance: metrics.store_performance || [],
    };
  }

  private buildDateFilterClause(startDate?: Date, endDate?: Date): string {
    const conditions: string[] = [];

    if (startDate) {
      conditions.push('created_at >= :startDate');
    }

    if (endDate) {
      conditions.push('created_at <= :endDate');
    }

    return conditions.length ? 'AND ' + conditions.join(' AND ') : '';
  }

  private buildQueryParameters(userId: string, startDate?: Date, endDate?: Date): any[] {
    const parameters: any[] = [];

    if (userId) {
      parameters.push(userId);
    }

    if (startDate) {
      parameters.push(startDate);
    }

    if (endDate) {
      parameters.push(endDate);
    }

    return parameters;
  }
} 