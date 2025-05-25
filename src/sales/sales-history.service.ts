import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { Sale, SaleStatus } from './entities/sale.entity';
import { SalesHistoryFilterDto, HistoryItemType, SortField, SortOrder } from './dto/sales-history-filter.dto';
import { Purchase } from '../purchases/entities/purchase.entity';
import { HistoryItem } from './interfaces/history-item.interface';

@Injectable()
export class SalesHistoryService {
  constructor(
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    @InjectRepository(Purchase)
    private readonly purchasesRepository: Repository<Purchase>,
    private readonly dataSource: DataSource,
  ) {}

  async getSalesHistory(userId: string, filters: SalesHistoryFilterDto): Promise<{
    items: HistoryItem[];
    total: number;
    page: number;
    totalPages: number;
    stats?: {
      total_sales: number;
      total_revenue: number;
      sales_by_status: Record<SaleStatus, number>;
      sales_by_period: {
        today: number;
        this_week: number;
        this_month: number;
      };
    };
  }> {
    const { 
      page = 1, 
      limit = 20, 
      types = [HistoryItemType.SALE, HistoryItemType.CANCELLED_SALE, HistoryItemType.PURCHASE],
      sort_by = SortField.CREATED_AT,
      sort_order = SortOrder.DESC
    } = filters;
    const skip = (page - 1) * limit;

    // Build base queries for each type
    const [activeSalesQuery, cancelledSalesQuery, purchasesQuery] = await Promise.all([
      this.getActiveSalesQuery(userId, filters),
      this.getCancelledSalesQuery(userId, filters),
      this.getPurchasesQuery(userId, filters)
    ]);

    // Build WHERE clause for filters
    const whereClause = this.buildWhereClause(filters);
    const orderClause = `ORDER BY ${sort_by} ${sort_order}`;

    // Combine queries using raw SQL for better performance
    const combinedQuery = `
      WITH combined_history AS (
        ${activeSalesQuery.getQuery()}
        UNION ALL
        ${cancelledSalesQuery.getQuery()}
        UNION ALL
        ${purchasesQuery.getQuery()}
      )
      SELECT * FROM combined_history
      WHERE 1=1
      ${whereClause}
      ${orderClause}
      LIMIT $${Object.keys(filters).length + 1} OFFSET $${Object.keys(filters).length + 2}
    `;

    // Get total count and stats
    const statsQuery = `
      WITH combined_history AS (
        ${activeSalesQuery.getQuery()}
        UNION ALL
        ${cancelledSalesQuery.getQuery()}
        UNION ALL
        ${purchasesQuery.getQuery()}
      ),
      filtered_history AS (
        SELECT * FROM combined_history
        WHERE 1=1
        ${whereClause}
      )
      SELECT 
        COUNT(*) as total_count,
        SUM(price * quantity) as total_revenue,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available_count,
        COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved_count,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_count,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_count,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_count,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as month_count
      FROM filtered_history
    `;

    // Prepare parameters
    const parameters = this.buildQueryParameters(filters, limit, skip);

    // Execute queries
    const [results, [{ 
      total_count, 
      total_revenue,
      available_count,
      reserved_count,
      shipped_count,
      delivered_count,
      completed_count,
      cancelled_count,
      today_count,
      week_count,
      month_count
    }]] = await Promise.all([
      this.dataSource.query(combinedQuery, parameters),
      this.dataSource.query(statsQuery, parameters.slice(0, -2))
    ]);

    const total = parseInt(total_count);

    // Enrich results with related data
    const enrichedResults = await Promise.all(
      results.map(async (item) => {
        const [category, language, seller, buyer, store] = await Promise.all([
          item.category_id ? this.getCategoryInfo(item.category_id) : null,
          item.language_id ? this.getLanguageInfo(item.language_id) : null,
          item.seller_id ? this.getUserInfo(item.seller_id) : null,
          item.buyer_id ? this.getUserInfo(item.buyer_id) : null,
          item.store_id ? this.getStoreInfo(item.store_id) : null,
        ]);

        return {
          ...item,
          category,
          language,
          seller,
          buyer,
          store,
        };
      })
    );

    return {
      items: enrichedResults,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        total_sales: total,
        total_revenue: parseFloat(total_revenue) || 0,
        sales_by_status: {
          [SaleStatus.AVAILABLE]: parseInt(available_count) || 0,
          [SaleStatus.RESERVED]: parseInt(reserved_count) || 0,
          [SaleStatus.SHIPPED]: parseInt(shipped_count) || 0,
          [SaleStatus.DELIVERED]: parseInt(delivered_count) || 0,
          [SaleStatus.COMPLETED]: parseInt(completed_count) || 0,
          [SaleStatus.CANCELLED]: parseInt(cancelled_count) || 0,
        },
        sales_by_period: {
          today: parseInt(today_count) || 0,
          this_week: parseInt(week_count) || 0,
          this_month: parseInt(month_count) || 0,
        }
      }
    };
  }

  private buildWhereClause(filters: SalesHistoryFilterDto): string {
    const conditions: string[] = [];
    let paramIndex = 1;

    if (filters.search) {
      conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      paramIndex++;
    }

    if (filters.category_ids?.length) {
      conditions.push(`category_id = ANY($${paramIndex})`);
      paramIndex++;
    } else if (filters.category_id) {
      conditions.push(`category_id = $${paramIndex}`);
      paramIndex++;
    }

    if (filters.language_ids?.length) {
      conditions.push(`language_id = ANY($${paramIndex})`);
      paramIndex++;
    } else if (filters.language_id) {
      conditions.push(`language_id = $${paramIndex}`);
      paramIndex++;
    }

    if (filters.store_ids?.length) {
      conditions.push(`store_id = ANY($${paramIndex})`);
      paramIndex++;
    } else if (filters.store_id) {
      conditions.push(`store_id = $${paramIndex}`);
      paramIndex++;
    }

    if (filters.start_date) {
      conditions.push(`created_at >= $${paramIndex}`);
      paramIndex++;
    }

    if (filters.end_date) {
      conditions.push(`created_at <= $${paramIndex}`);
      paramIndex++;
    }

    if (filters.min_price !== undefined) {
      conditions.push(`price >= $${paramIndex}`);
      paramIndex++;
    }

    if (filters.max_price !== undefined) {
      conditions.push(`price <= $${paramIndex}`);
      paramIndex++;
    }

    if (filters.min_quantity !== undefined) {
      conditions.push(`quantity >= $${paramIndex}`);
      paramIndex++;
    }

    if (filters.max_quantity !== undefined) {
      conditions.push(`quantity <= $${paramIndex}`);
      paramIndex++;
    }

    if (filters.has_shipping_proof !== undefined) {
      conditions.push(`shipping_proof_url IS ${filters.has_shipping_proof ? 'NOT NULL' : 'NULL'}`);
    }

    if (filters.has_delivery_proof !== undefined) {
      conditions.push(`delivery_proof_url IS ${filters.has_delivery_proof ? 'NOT NULL' : 'NULL'}`);
    }

    if (filters.statuses?.length) {
      conditions.push(`status = ANY($${paramIndex})`);
      paramIndex++;
    } else if (filters.status) {
      conditions.push(`status = $${paramIndex}`);
      paramIndex++;
    }

    if (filters.types?.length) {
      conditions.push(`type = ANY($${paramIndex})`);
      paramIndex++;
    } else if (filters.type) {
      conditions.push(`type = $${paramIndex}`);
      paramIndex++;
    }

    return conditions.length ? conditions.join(' AND ') : '';
  }

  private buildQueryParameters(filters: SalesHistoryFilterDto, limit: number, skip: number): any[] {
    const parameters: any[] = [];

    if (filters.search) {
      parameters.push(`%${filters.search}%`);
    }

    if (filters.category_ids?.length) {
      parameters.push(filters.category_ids);
    } else if (filters.category_id) {
      parameters.push(filters.category_id);
    }

    if (filters.language_ids?.length) {
      parameters.push(filters.language_ids);
    } else if (filters.language_id) {
      parameters.push(filters.language_id);
    }

    if (filters.store_ids?.length) {
      parameters.push(filters.store_ids);
    } else if (filters.store_id) {
      parameters.push(filters.store_id);
    }

    if (filters.start_date) {
      parameters.push(filters.start_date);
    }

    if (filters.end_date) {
      parameters.push(filters.end_date);
    }

    if (filters.min_price !== undefined) {
      parameters.push(filters.min_price);
    }

    if (filters.max_price !== undefined) {
      parameters.push(filters.max_price);
    }

    if (filters.min_quantity !== undefined) {
      parameters.push(filters.min_quantity);
    }

    if (filters.max_quantity !== undefined) {
      parameters.push(filters.max_quantity);
    }

    if (filters.statuses?.length) {
      parameters.push(filters.statuses);
    } else if (filters.status) {
      parameters.push(filters.status);
    }

    if (filters.types?.length) {
      parameters.push(filters.types);
    } else if (filters.type) {
      parameters.push(filters.type);
    }

    parameters.push(limit, skip);

    return parameters;
  }

  private async getCategoryInfo(categoryId: string) {
    return this.dataSource
      .createQueryBuilder()
      .select(['id', 'name', 'description', 'image_url'])
      .from('categories', 'c')
      .where('c.id = :categoryId', { categoryId })
      .getRawOne();
  }

  private async getLanguageInfo(languageId: string) {
    return this.dataSource
      .createQueryBuilder()
      .select(['id', 'name', 'code', 'flag_url'])
      .from('languages', 'l')
      .where('l.id = :languageId', { languageId })
      .getRawOne();
  }

  private async getUserInfo(userId: string) {
    return this.dataSource
      .createQueryBuilder()
      .select(['id', 'name', 'email', 'avatar_url', 'is_pro'])
      .from('users', 'u')
      .where('u.id = :userId', { userId })
      .getRawOne();
  }

  private async getStoreInfo(storeId: string) {
    return this.dataSource
      .createQueryBuilder()
      .select(['id', 'name', 'description', 'logo_url', 'banner_url'])
      .from('stores', 's')
      .where('s.id = :storeId', { storeId })
      .getRawOne();
  }

  private getActiveSalesQuery(userId: string, filters: SalesHistoryFilterDto): SelectQueryBuilder<Sale> {
    const query = this.dataSource
      .createQueryBuilder()
      .select([
        's.id',
        `'${HistoryItemType.SALE}' as type`,
        's.name',
        's.description',
        's.price',
        's.quantity',
        's.image_url',
        's.status',
        's.category_id',
        's.language_id',
        's.seller_id',
        's.buyer_id',
        's.store_id',
        's.created_at',
        's.updated_at',
        'NULL as cancelled_at',
        's.completed_at',
        'NULL as cancellation_reason',
        's.shipping_proof_url',
        's.delivery_proof_url'
      ])
      .from(Sale, 's')
      .where('s.seller_id = :userId OR s.buyer_id = :userId', { userId })
      .andWhere('s.status != :cancelledStatus', { cancelledStatus: SaleStatus.CANCELLED });

    return query;
  }

  private getCancelledSalesQuery(userId: string, filters: SalesHistoryFilterDto): SelectQueryBuilder<any> {
    const query = this.dataSource
      .createQueryBuilder()
      .select([
        'sc.id',
        `'${HistoryItemType.CANCELLED_SALE}' as type`,
        'sc.name',
        'sc.description',
        'sc.price',
        'sc.quantity',
        'sc.image_url',
        `'cancelled' as status`,
        'sc.category_id',
        'sc.language_id',
        'sc.seller_id',
        'sc.buyer_id',
        'sc.store_id',
        'sc.created_at',
        'sc.updated_at',
        'sc.cancelled_at',
        'NULL as completed_at',
        'sc.cancellation_reason',
        'sc.shipping_proof_url',
        'sc.delivery_proof_url'
      ])
      .from('sales_cancelled', 'sc')
      .where('sc.seller_id = :userId OR sc.buyer_id = :userId', { userId });

    return query;
  }

  private getPurchasesQuery(userId: string, filters: SalesHistoryFilterDto): SelectQueryBuilder<Purchase> {
    const query = this.dataSource
      .createQueryBuilder()
      .select([
        'p.id',
        `'${HistoryItemType.PURCHASE}' as type`,
        'p.name',
        'p.description',
        'p.price',
        'p.quantity',
        'p.image_url',
        `'completed' as status`,
        'p.category_id',
        'p.language_id',
        'p.seller_id',
        'p.user_id as buyer_id',
        'NULL as store_id',
        'p.created_at',
        'p.created_at as updated_at',
        'NULL as cancelled_at',
        'p.created_at as completed_at',
        'NULL as cancellation_reason',
        'NULL as shipping_proof_url',
        'NULL as delivery_proof_url'
      ])
      .from(Purchase, 'p')
      .where('p.user_id = :userId', { userId });

    return query;
  }
} 