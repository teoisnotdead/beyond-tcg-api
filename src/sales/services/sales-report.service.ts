import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale, SaleStatus } from '../entities/sale.entity';
import { SalesReportDto, SalesReportFilterDto } from '../dto/sales-report.dto';

interface WeekDate {
  week_start: string;
  week_end: string;
}

interface DailyReportItem {
  date: string;
  total_sales: number;
  total_revenue: number;
  average_price: number;
}

interface WeeklyReportItem {
  week_start: string;
  week_end: string;
  total_sales: number;
  total_revenue: number;
  average_price: number;
}

interface MonthlyReportItem {
  month: string;
  total_sales: number;
  total_revenue: number;
  average_price: number;
}

@Injectable()
export class SalesReportService {
  constructor(
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    private readonly dataSource: DataSource,
  ) {}

  async generateReport(userId: string, filters: SalesReportFilterDto): Promise<SalesReportDto> {
    const whereClause = this.buildWhereClause(userId, filters);
    const parameters = this.buildQueryParameters(userId, filters);

    // Consulta para el reporte por período
    const periodReport = await this.generatePeriodReport(whereClause, parameters, filters.group_by);

    // Consulta para el reporte por categoría
    const categoryReport = await this.generateCategoryReport(whereClause, parameters, filters.limit);

    // Consulta para el reporte por tienda
    const storeReport = await this.generateStoreReport(whereClause, parameters, filters.limit);

    // Consulta para el reporte de estados
    const statusReport = await this.generateStatusReport(whereClause, parameters);

    return {
      period_report: periodReport,
      category_report: categoryReport,
      store_report: storeReport,
      status_report: statusReport,
    };
  }

  private async generatePeriodReport(
    whereClause: string,
    parameters: any[],
    groupBy: 'day' | 'week' | 'month' = 'day'
  ) {
    const dateTrunc = groupBy === 'day' ? 'day' : groupBy === 'week' ? 'week' : 'month';
    const query = `
      WITH period_data AS (
        SELECT
          DATE_TRUNC('${dateTrunc}', created_at) as period,
          COUNT(*) as total_sales,
          SUM(price * quantity) as total_revenue,
          AVG(price * quantity) as average_price
        FROM sales
        WHERE 1=1 ${whereClause}
        GROUP BY DATE_TRUNC('${dateTrunc}', created_at)
        ORDER BY period DESC
      )
      SELECT 
        period,
        total_sales,
        total_revenue,
        average_price
      FROM period_data
    `;

    const results = await this.dataSource.query(query, parameters);
    return this.formatPeriodReport(results, groupBy);
  }

  private async generateCategoryReport(
    whereClause: string,
    parameters: any[],
    limit?: number
  ) {
    const limitClause = limit ? `LIMIT ${limit}` : '';
    const query = `
      WITH category_stats AS (
        SELECT
          c.id as category_id,
          c.name as category_name,
          COUNT(*) as total_sales,
          SUM(s.price * s.quantity) as total_revenue,
          AVG(s.price * s.quantity) as average_price,
          COUNT(CASE WHEN s.status = 'completed' THEN 1 END)::float / NULLIF(COUNT(*), 0) as conversion_rate,
          jsonb_object_agg(
            s.status,
            COUNT(*)
          ) as sales_by_status
        FROM sales s
        JOIN categories c ON c.id = s.category_id
        WHERE 1=1 ${whereClause}
        GROUP BY c.id, c.name
        ORDER BY total_revenue DESC
        ${limitClause}
      )
      SELECT * FROM category_stats
    `;

    return await this.dataSource.query(query, parameters);
  }

  private async generateStoreReport(
    whereClause: string,
    parameters: any[],
    limit?: number
  ) {
    const limitClause = limit ? `LIMIT ${limit}` : '';
    const query = `
      WITH store_stats AS (
        SELECT
          st.id as store_id,
          st.name as store_name,
          COUNT(*) as total_sales,
          SUM(s.price * s.quantity) as total_revenue,
          AVG(s.price * s.quantity) as average_price,
          COUNT(CASE WHEN s.status = 'completed' THEN 1 END)::float / NULLIF(COUNT(*), 0) as conversion_rate,
          jsonb_object_agg(
            s.status,
            COUNT(*)
          ) as sales_by_status,
          (
            SELECT json_agg(cat_stats)
            FROM (
              SELECT
                c.id as category_id,
                c.name as category_name,
                COUNT(*) as total_sales,
                SUM(s2.price * s2.quantity) as total_revenue
              FROM sales s2
              JOIN categories c ON c.id = s2.category_id
              WHERE s2.store_id = st.id
              GROUP BY c.id, c.name
              ORDER BY total_revenue DESC
              LIMIT 5
            ) cat_stats
          ) as top_categories
        FROM sales s
        JOIN stores st ON st.id = s.store_id
        WHERE 1=1 ${whereClause}
        GROUP BY st.id, st.name
        ORDER BY total_revenue DESC
        ${limitClause}
      )
      SELECT * FROM store_stats
    `;

    return await this.dataSource.query(query, parameters);
  }

  private async generateStatusReport(
    whereClause: string,
    parameters: any[]
  ) {
    const query = `
      WITH status_stats AS (
        SELECT
          status,
          COUNT(*) as count,
          SUM(price * quantity) as revenue,
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as average_time_in_status
        FROM sales
        WHERE 1=1 ${whereClause}
        GROUP BY status
      ),
      transition_stats AS (
        SELECT
          old_status as from_status,
          status as to_status,
          COUNT(*) as count,
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as average_transition_time
        FROM sales_status_history
        WHERE 1=1 ${whereClause}
        GROUP BY old_status, status
      )
      SELECT
        jsonb_build_object(
          'by_status', (
            SELECT jsonb_object_agg(
              status,
              jsonb_build_object(
                'count', count,
                'revenue', revenue,
                'average_time_in_status', average_time_in_status
              )
            )
            FROM status_stats
          ),
          'status_transitions', (
            SELECT json_agg(row_to_json(t))
            FROM (
              SELECT
                from_status,
                to_status,
                count,
                average_transition_time
              FROM transition_stats
              ORDER BY count DESC
            ) t
          )
        ) as status_report
    `;

    const [result] = await this.dataSource.query(query, parameters);
    return result.status_report;
  }

  private formatPeriodReport(
    results: any[], 
    groupBy: 'day' | 'week' | 'month'
  ): {
    daily: DailyReportItem[];
    weekly: WeeklyReportItem[];
    monthly: MonthlyReportItem[];
  } {
    const formatDate = (date: Date): string | WeekDate => {
      switch (groupBy) {
        case 'day':
          return date.toISOString().split('T')[0];
        case 'week':
          const weekStart = new Date(date);
          const weekEnd = new Date(date);
          weekEnd.setDate(weekEnd.getDate() + 6);
          return {
            week_start: weekStart.toISOString().split('T')[0],
            week_end: weekEnd.toISOString().split('T')[0],
          };
        case 'month':
          return date.toISOString().slice(0, 7); // YYYY-MM
      }
    };

    const baseItem = {
      total_sales: 0,
      total_revenue: 0,
      average_price: 0,
    };

    const formattedResults = results.map(row => {
      const formattedDate = formatDate(row.period);
      const metrics = {
        total_sales: parseInt(row.total_sales),
        total_revenue: parseFloat(row.total_revenue),
        average_price: parseFloat(row.average_price),
      };

      if (groupBy === 'week') {
        const weekDate = formattedDate as WeekDate;
        return {
          week_start: weekDate.week_start,
          week_end: weekDate.week_end,
          ...metrics,
        } as WeeklyReportItem;
      } else if (groupBy === 'month') {
        return {
          month: formattedDate as string,
          ...metrics,
        } as MonthlyReportItem;
      } else {
        return {
          date: formattedDate as string,
          ...metrics,
        } as DailyReportItem;
      }
    });

    return {
      daily: groupBy === 'day' ? formattedResults as DailyReportItem[] : [],
      weekly: groupBy === 'week' ? formattedResults as WeeklyReportItem[] : [],
      monthly: groupBy === 'month' ? formattedResults as MonthlyReportItem[] : [],
    };
  }

  private buildWhereClause(userId: string, filters: SalesReportFilterDto): string {
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

    return conditions.length ? 'AND ' + conditions.join(' AND ') : '';
  }

  private buildQueryParameters(userId: string, filters: SalesReportFilterDto): any[] {
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

    return [parameters];
  }
} 