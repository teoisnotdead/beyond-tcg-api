import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale } from '../entities/sale.entity';
import { SalesAnalysisFilterDto } from '../dto/sales-analysis.dto';

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap';
  title: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[] | number[][];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
  }>;
  options?: {
    xAxisLabel?: string;
    yAxisLabel?: string;
    showLegend?: boolean;
    stacked?: boolean;
  };
}

@Injectable()
export class SalesVisualizationService {
  constructor(
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    private readonly dataSource: DataSource,
  ) {}

  async generateSalesTrendChart(
    userId: string,
    filters: SalesAnalysisFilterDto
  ): Promise<ChartData> {
    const whereClause = this.buildWhereClause(userId, filters);
    const parameters = this.buildQueryParameters(userId, filters);
    const period = filters.comparison_period || 'days';
    const periods = filters.periods || 30;

    const query = `
      SELECT
        DATE_TRUNC('${period}', created_at) as period,
        COUNT(*) as total_sales,
        SUM(price * quantity) as total_revenue,
        AVG(price * quantity) as average_price
      FROM sales
      WHERE 1=1 ${whereClause}
      GROUP BY DATE_TRUNC('${period}', created_at)
      ORDER BY period ASC
      LIMIT ${periods}
    `;

    const results = await this.dataSource.query(query, parameters);

    return {
      type: 'line',
      title: 'Sales Trend',
      labels: results.map(r => this.formatDate(r.period, period)),
      datasets: [
        {
          label: 'Total Sales',
          data: results.map(r => parseInt(r.total_sales)),
          borderColor: '#4CAF50',
          fill: false
        },
        {
          label: 'Total Revenue',
          data: results.map(r => parseFloat(r.total_revenue)),
          borderColor: '#2196F3',
          fill: false
        },
        {
          label: 'Average Price',
          data: results.map(r => parseFloat(r.average_price)),
          borderColor: '#FFC107',
          fill: false
        }
      ],
      options: {
        xAxisLabel: 'Period',
        yAxisLabel: 'Value',
        showLegend: true
      }
    };
  }

  async generatePriceDistributionChart(
    userId: string,
    filters: SalesAnalysisFilterDto
  ): Promise<ChartData> {
    const whereClause = this.buildWhereClause(userId, filters);
    const parameters = this.buildQueryParameters(userId, filters);

    const query = `
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
      ORDER BY 
        CASE range
          WHEN '0-10' THEN 1
          WHEN '10-50' THEN 2
          WHEN '50-100' THEN 3
          WHEN '100-500' THEN 4
          ELSE 5
        END
    `;

    const results = await this.dataSource.query(query, parameters);

    return {
      type: 'bar',
      title: 'Distribución de Precios',
      labels: results.map(r => r.range),
      datasets: [{
        label: 'Cantidad de Ventas',
        data: results.map(r => parseInt(r.count)),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ]
      }],
      options: {
        xAxisLabel: 'Rango de Precios',
        yAxisLabel: 'Cantidad de Ventas',
        showLegend: false
      }
    };
  }

  async generateCategoryPerformanceChart(
    userId: string,
    filters: SalesAnalysisFilterDto
  ): Promise<ChartData> {
    const whereClause = this.buildWhereClause(userId, filters);
    const parameters = this.buildQueryParameters(userId, filters);

    const query = `
      SELECT
        c.name as category_name,
        COUNT(*) as total_sales,
        COUNT(CASE WHEN s.status = 'completed' THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100 as conversion_rate,
        AVG(EXTRACT(EPOCH FROM (s.updated_at - s.created_at))/3600) as average_time_to_sell
      FROM sales s
      JOIN categories c ON c.id = s.category_id
      WHERE 1=1 ${whereClause}
      GROUP BY c.id, c.name
      ORDER BY total_sales DESC
      LIMIT 10
    `;

    const results = await this.dataSource.query(query, parameters);

    return {
      type: 'bar',
      title: 'Category Performance',
      labels: results.map(r => r.category_name),
      datasets: [
        {
          label: 'Conversion Rate (%)',
          data: results.map(r => parseFloat(r.conversion_rate)),
          backgroundColor: '#4CAF50'
        },
        {
          label: 'Average Time to Sell (hours)',
          data: results.map(r => parseFloat(r.average_time_to_sell)),
          backgroundColor: '#2196F3'
        }
      ],
      options: {
        xAxisLabel: 'Category',
        yAxisLabel: 'Value',
        showLegend: true,
        stacked: false
      }
    };
  }

  async generateTimeOfDayHeatmap(
    userId: string,
    filters: SalesAnalysisFilterDto
  ): Promise<ChartData> {
    const whereClause = this.buildWhereClause(userId, filters);
    const parameters = this.buildQueryParameters(userId, filters);

    const query = `
      SELECT
        EXTRACT(DOW FROM created_at) as day_of_week,
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as total_sales,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100 as conversion_rate
      FROM sales
      WHERE 1=1 ${whereClause}
      GROUP BY day_of_week, hour
      ORDER BY day_of_week, hour
    `;

    const results = await this.dataSource.query(query, parameters);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const hours = Array.from({length: 24}, (_, i) => i.toString());

    // Crear matriz de datos para el heatmap
    const data: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
    results.forEach(r => {
      data[r.day_of_week][r.hour] = parseFloat(r.conversion_rate);
    });

    return {
      type: 'heatmap',
      title: 'Tasa de Conversión por Día y Hora',
      labels: days,
      datasets: [{
        label: 'Tasa de Conversión (%)',
        data: data,
        backgroundColor: '#FF6384'
      }],
      options: {
        xAxisLabel: 'Hora del Día',
        yAxisLabel: 'Día de la Semana',
        showLegend: true
      }
    };
  }

  async generateUserBehaviorChart(
    userId: string,
    filters: SalesAnalysisFilterDto
  ): Promise<ChartData> {
    const whereClause = this.buildWhereClause(userId, filters);
    const parameters = this.buildQueryParameters(userId, filters);

    const query = `
      WITH user_metrics AS (
        SELECT
          buyer_id,
          COUNT(*) as purchase_count,
          AVG(price * quantity) as average_purchase_value,
          COUNT(DISTINCT category_id) as unique_categories
        FROM sales
        WHERE 1=1 ${whereClause}
        GROUP BY buyer_id
      )
      SELECT
        CASE
          WHEN purchase_count = 1 THEN '1 compra'
          WHEN purchase_count <= 3 THEN '2-3 compras'
          WHEN purchase_count <= 5 THEN '4-5 compras'
          ELSE '5+ compras'
        END as purchase_frequency,
        COUNT(*) as user_count,
        AVG(average_purchase_value) as avg_value,
        AVG(unique_categories) as avg_categories
      FROM user_metrics
      GROUP BY purchase_frequency
      ORDER BY 
        CASE purchase_frequency
          WHEN '1 compra' THEN 1
          WHEN '2-3 compras' THEN 2
          WHEN '4-5 compras' THEN 3
          ELSE 4
        END
    `;

    const results = await this.dataSource.query(query, parameters);

    return {
      type: 'bar',
      title: 'Buyer Behavior',
      labels: results.map(r => r.purchase_frequency),
      datasets: [
        {
          label: 'Number of Users',
          data: results.map(r => parseInt(r.user_count)),
          backgroundColor: '#4CAF50'
        },
        {
          label: 'Average Purchase Value',
          data: results.map(r => parseFloat(r.avg_value)),
          backgroundColor: '#2196F3'
        },
        {
          label: 'Average Unique Categories',
          data: results.map(r => parseFloat(r.avg_categories)),
          backgroundColor: '#FFC107'
        }
      ],
      options: {
        xAxisLabel: 'Purchase Frequency',
        yAxisLabel: 'Value',
        showLegend: true,
        stacked: false
      }
    };
  }

  private formatDate(date: Date, period: string): string {
    const d = new Date(date);
    switch (period) {
      case 'days':
        return d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' });
      case 'weeks':
        const weekNumber = this.getWeekNumber(d);
        return `Week ${weekNumber}`;
      case 'months':
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      default:
        return d.toLocaleDateString('en-US');
    }
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
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