import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale, SaleStatus } from '../entities/sale.entity';
import { SalesAnalysisDto, SalesAnalysisFilterDto } from '../dto/sales-analysis.dto';

@Injectable()
export class SalesAnalysisService {
  constructor(
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    private readonly dataSource: DataSource,
  ) {}

  async generateAnalysis(userId: string, filters: SalesAnalysisFilterDto): Promise<SalesAnalysisDto> {
    const whereClause = this.buildWhereClause(userId, filters);
    const parameters = this.buildQueryParameters(userId, filters);

    // Generar todos los análisis
    const [trends, priceAnalysis, categoryAnalysis, userBehavior] = await Promise.all([
      this.analyzeTrends(whereClause, parameters, filters),
      this.analyzePrices(whereClause, parameters),
      this.analyzeCategories(whereClause, parameters),
      this.analyzeUserBehavior(whereClause, parameters),
    ]);

    return {
      trends,
      price_analysis: priceAnalysis,
      category_analysis: categoryAnalysis,
      user_behavior: userBehavior,
    };
  }

  private async analyzeTrends(
    whereClause: string,
    parameters: any[],
    filters: SalesAnalysisFilterDto
  ) {
    const period = filters.comparison_period || 'days';
    const periods = filters.periods || 2;

    const query = `
      WITH period_data AS (
        SELECT
          DATE_TRUNC('${period}', created_at) as period,
          COUNT(*) as total_sales,
          SUM(price * quantity) as total_revenue,
          AVG(price * quantity) as average_price
        FROM sales
        WHERE 1=1 ${whereClause}
        GROUP BY DATE_TRUNC('${period}', created_at)
        ORDER BY period DESC
        LIMIT ${periods}
      ),
      current_period AS (
        SELECT * FROM period_data ORDER BY period DESC LIMIT 1
      ),
      previous_period AS (
        SELECT * FROM period_data ORDER BY period DESC OFFSET 1 LIMIT 1
      )
      SELECT
        jsonb_build_object(
          'sales_trend', jsonb_build_object(
            'period', (SELECT period FROM current_period),
            'current_value', (SELECT total_sales FROM current_period),
            'previous_value', (SELECT total_sales FROM previous_period),
            'percentage_change', CASE 
              WHEN (SELECT total_sales FROM previous_period) = 0 THEN 0
              ELSE ((SELECT total_sales FROM current_period) - (SELECT total_sales FROM previous_period))::float / 
                   (SELECT total_sales FROM previous_period) * 100
            END,
            'trend_direction', CASE
              WHEN (SELECT total_sales FROM current_period) > (SELECT total_sales FROM previous_period) THEN 'up'
              WHEN (SELECT total_sales FROM current_period) < (SELECT total_sales FROM previous_period) THEN 'down'
              ELSE 'stable'
            END
          ),
          'revenue_trend', jsonb_build_object(
            'period', (SELECT period FROM current_period),
            'current_value', (SELECT total_revenue FROM current_period),
            'previous_value', (SELECT total_revenue FROM previous_period),
            'percentage_change', CASE 
              WHEN (SELECT total_revenue FROM previous_period) = 0 THEN 0
              ELSE ((SELECT total_revenue FROM current_period) - (SELECT total_revenue FROM previous_period))::float / 
                   (SELECT total_revenue FROM previous_period) * 100
            END,
            'trend_direction', CASE
              WHEN (SELECT total_revenue FROM current_period) > (SELECT total_revenue FROM previous_period) THEN 'up'
              WHEN (SELECT total_revenue FROM current_period) < (SELECT total_revenue FROM previous_period) THEN 'down'
              ELSE 'stable'
            END
          ),
          'average_price_trend', jsonb_build_object(
            'period', (SELECT period FROM current_period),
            'current_value', (SELECT average_price FROM current_period),
            'previous_value', (SELECT average_price FROM previous_period),
            'percentage_change', CASE 
              WHEN (SELECT average_price FROM previous_period) = 0 THEN 0
              ELSE ((SELECT average_price FROM current_period) - (SELECT average_price FROM previous_period))::float / 
                   (SELECT average_price FROM previous_period) * 100
            END,
            'trend_direction', CASE
              WHEN (SELECT average_price FROM current_period) > (SELECT average_price FROM previous_period) THEN 'up'
              WHEN (SELECT average_price FROM current_period) < (SELECT average_price FROM previous_period) THEN 'down'
              ELSE 'stable'
            END
          )
        ) as trends
    `;

    const [result] = await this.dataSource.query(query, parameters);
    return result.trends;
  }

  private async analyzePrices(whereClause: string, parameters: any[]) {
    const query = `
      WITH price_stats AS (
        SELECT
          c.id as category_id,
          c.name as category_name,
          AVG(s.price * s.quantity) as average_price,
          MIN(s.price * s.quantity) as min_price,
          MAX(s.price * s.quantity) as max_price,
          STDDEV(s.price * s.quantity) as price_standard_deviation
        FROM sales s
        JOIN categories c ON c.id = s.category_id
        WHERE 1=1 ${whereClause}
        GROUP BY c.id, c.name
      ),
      price_ranges AS (
        SELECT
          CASE
            WHEN price * quantity < 10 THEN '0-10'
            WHEN price * quantity < 50 THEN '10-50'
            WHEN price * quantity < 100 THEN '50-100'
            WHEN price * quantity < 500 THEN '100-500'
            ELSE '500+'
          END as range,
          COUNT(*) as count
        FROM sales
        WHERE 1=1 ${whereClause}
        GROUP BY range
      ),
      price_correlations AS (
        SELECT
          CORR(price * quantity, 1) as price_vs_sales,
          CORR(
            price * quantity,
            CASE WHEN status = 'completed' THEN 1 ELSE 0 END
          ) as price_vs_conversion
        FROM sales
        WHERE 1=1 ${whereClause}
      )
      SELECT
        jsonb_build_object(
          'price_distribution', (
            SELECT json_agg(
              jsonb_build_object(
                'range', range,
                'count', count,
                'percentage', count::float / (SELECT SUM(count) FROM price_ranges) * 100
              )
            )
            FROM price_ranges
          ),
          'average_price_by_category', (
            SELECT json_agg(
              jsonb_build_object(
                'category_id', category_id,
                'category_name', category_name,
                'average_price', average_price,
                'min_price', min_price,
                'max_price', max_price,
                'price_standard_deviation', price_standard_deviation
              )
            )
            FROM price_stats
          ),
          'price_correlation', (
            SELECT jsonb_build_object(
              'price_vs_sales', price_vs_sales,
              'price_vs_conversion', price_vs_conversion
            )
            FROM price_correlations
          )
        ) as price_analysis
    `;

    const [result] = await this.dataSource.query(query, parameters);
    return result.price_analysis;
  }

  private async analyzeCategories(whereClause: string, parameters: any[]) {
    const query = `
      WITH category_stats AS (
        SELECT
          c.id as category_id,
          c.name as category_name,
          COUNT(*) as total_sales,
          COUNT(CASE WHEN s.status = 'completed' THEN 1 END)::float / NULLIF(COUNT(*), 0) as conversion_rate,
          AVG(EXTRACT(EPOCH FROM (s.updated_at - s.created_at))/3600) as average_time_to_sell,
          COUNT(CASE WHEN s.status = 'cancelled' THEN 1 END)::float / NULLIF(COUNT(*), 0) as return_rate
        FROM sales s
        JOIN categories c ON c.id = s.category_id
        WHERE 1=1 ${whereClause}
        GROUP BY c.id, c.name
      ),
      category_growth AS (
        SELECT
          c.id as category_id,
          c.name as category_name,
          COUNT(CASE WHEN s.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as current_period_sales,
          COUNT(CASE WHEN s.created_at >= CURRENT_DATE - INTERVAL '60 days' AND s.created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as previous_period_sales
        FROM sales s
        JOIN categories c ON c.id = s.category_id
        WHERE 1=1 ${whereClause}
        GROUP BY c.id, c.name
      ),
      category_diversity AS (
        SELECT
          COUNT(DISTINCT category_id) as total_categories,
          COUNT(DISTINCT CASE WHEN total_sales > 0 THEN category_id END) as active_categories,
          SUM(CASE WHEN row_num <= 3 THEN total_sales ELSE 0 END)::float / NULLIF(SUM(total_sales), 0) as top_categories_share
        FROM (
          SELECT
            category_id,
            COUNT(*) as total_sales,
            ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as row_num
          FROM sales
          WHERE 1=1 ${whereClause}
          GROUP BY category_id
        ) ranked_categories
      )
      SELECT
        jsonb_build_object(
          'category_growth', (
            SELECT json_agg(
              jsonb_build_object(
                'category_id', cg.category_id,
                'category_name', cg.category_name,
                'current_period_sales', cg.current_period_sales,
                'previous_period_sales', cg.previous_period_sales,
                'growth_rate', CASE 
                  WHEN cg.previous_period_sales = 0 THEN 0
                  ELSE (cg.current_period_sales - cg.previous_period_sales)::float / cg.previous_period_sales * 100
                END
              )
            )
            FROM category_growth cg
          ),
          'category_diversity', (
            SELECT jsonb_build_object(
              'total_categories', total_categories,
              'active_categories', active_categories,
              'category_concentration', top_categories_share,
              'top_categories_share', top_categories_share * 100
            )
            FROM category_diversity
          ),
          'category_performance', (
            SELECT json_agg(
              jsonb_build_object(
                'category_id', cs.category_id,
                'category_name', cs.category_name,
                'conversion_rate', cs.conversion_rate * 100,
                'average_time_to_sell', cs.average_time_to_sell,
                'return_rate', cs.return_rate * 100
              )
            )
            FROM category_stats cs
          )
        ) as category_analysis
    `;

    const [result] = await this.dataSource.query(query, parameters);
    return result.category_analysis;
  }

  private async analyzeUserBehavior(whereClause: string, parameters: any[]) {
    const query = `
      WITH seller_metrics AS (
        SELECT
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as average_listing_time,
          AVG(EXTRACT(EPOCH FROM (reserved_at - created_at))/3600) as average_response_time,
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / NULLIF(COUNT(*), 0) as completion_rate,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::float / NULLIF(COUNT(*), 0) as cancellation_rate
        FROM sales
        WHERE 1=1 ${whereClause}
      ),
      buyer_metrics AS (
        SELECT
          AVG(price * quantity) as average_purchase_value,
          COUNT(*)::float / NULLIF(DATE_PART('day', MAX(created_at) - MIN(created_at)), 0) as purchase_frequency,
          json_agg(
            jsonb_build_object(
              'category_id', c.id,
              'category_name', c.name,
              'purchase_count', COUNT(*),
              'total_spent', SUM(s.price * s.quantity)
            )
          ) as category_preference
        FROM sales s
        JOIN categories c ON c.id = s.category_id
        WHERE 1=1 ${whereClause}
        GROUP BY buyer_id
      ),
      interaction_metrics AS (
        SELECT
          AVG(views_count) as average_views_per_listing,
          AVG(offers_count) as average_offers_per_listing,
          json_agg(
            jsonb_build_object(
              'hour', EXTRACT(HOUR FROM created_at),
              'conversion_rate', COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / NULLIF(COUNT(*), 0)
            )
          ) as conversion_by_time_of_day
        FROM sales
        WHERE 1=1 ${whereClause}
        GROUP BY EXTRACT(HOUR FROM created_at)
      )
      SELECT
        jsonb_build_object(
          'seller_metrics', (
            SELECT jsonb_build_object(
              'average_listing_time', average_listing_time,
              'average_response_time', average_response_time,
              'completion_rate', completion_rate * 100,
              'cancellation_rate', cancellation_rate * 100
            )
            FROM seller_metrics
          ),
          'buyer_metrics', (
            SELECT jsonb_build_object(
              'average_purchase_value', average_purchase_value,
              'purchase_frequency', purchase_frequency,
              'category_preference', category_preference
            )
            FROM buyer_metrics
          ),
          'interaction_metrics', (
            SELECT jsonb_build_object(
              'average_views_per_listing', average_views_per_listing,
              'average_offers_per_listing', average_offers_per_listing,
              'conversion_by_time_of_day', conversion_by_time_of_day
            )
            FROM interaction_metrics
          )
        ) as user_behavior
    `;

    const [result] = await this.dataSource.query(query, parameters);
    return result.user_behavior;
  }

  private buildWhereClause(userId: string, filters: SalesAnalysisFilterDto): string {
    const conditions: string[] = [];

    if (userId) {
      conditions.push('(seller_id = :userId OR buyer_id = :userId)');
    }

    if (filters.start_date) {
      conditions.push('created_at >= :startDate');
    }

    if (filters.end_date) {
      conditions.push('created_at <= :endDate');
    }

    if (filters.category_ids?.length) {
      conditions.push('category_id = ANY(:categoryIds)');
    }

    if (filters.store_ids?.length) {
      conditions.push('store_id = ANY(:storeIds)');
    }

    if (filters.min_price !== undefined) {
      conditions.push('price * quantity >= :minPrice');
    }

    if (filters.max_price !== undefined) {
      conditions.push('price * quantity <= :maxPrice');
    }

    return conditions.length ? 'AND ' + conditions.join(' AND ') : '';
  }

  private buildQueryParameters(userId: string, filters: SalesAnalysisFilterDto): any[] {
    const parameters: any = {};

    if (userId) {
      parameters.userId = userId;
    }

    if (filters.start_date) {
      parameters.startDate = new Date(filters.start_date);
    }

    if (filters.end_date) {
      parameters.endDate = new Date(filters.end_date);
    }

    if (filters.category_ids?.length) {
      parameters.categoryIds = filters.category_ids;
    }

    if (filters.store_ids?.length) {
      parameters.storeIds = filters.store_ids;
    }

    if (filters.min_price !== undefined) {
      parameters.minPrice = filters.min_price;
    }

    if (filters.max_price !== undefined) {
      parameters.maxPrice = filters.max_price;
    }

    return [parameters];
  }
} 