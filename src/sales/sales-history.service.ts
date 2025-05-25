import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { Sale, SaleStatus } from './entities/sale.entity';
import { SalesHistoryFilterDto, HistoryItemType } from './dto/sales-history-filter.dto';
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
  }> {
    const { page = 1, limit = 20, types = [HistoryItemType.SALE, HistoryItemType.CANCELLED_SALE, HistoryItemType.PURCHASE] } = filters;
    const skip = (page - 1) * limit;

    // Build base queries for each type
    const [activeSalesQuery, cancelledSalesQuery, purchasesQuery] = await Promise.all([
      this.getActiveSalesQuery(userId, filters),
      this.getCancelledSalesQuery(userId, filters),
      this.getPurchasesQuery(userId, filters)
    ]);

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
      ${filters.search ? `AND (name ILIKE $${Object.keys(filters).indexOf('search') + 1} OR description ILIKE $${Object.keys(filters).indexOf('search') + 1})` : ''}
      ${filters.category_id ? `AND category_id = $${Object.keys(filters).indexOf('category_id') + 1}` : ''}
      ${filters.language_id ? `AND language_id = $${Object.keys(filters).indexOf('language_id') + 1}` : ''}
      ${filters.start_date ? `AND created_at >= $${Object.keys(filters).indexOf('start_date') + 1}` : ''}
      ${filters.end_date ? `AND created_at <= $${Object.keys(filters).indexOf('end_date') + 1}` : ''}
      ORDER BY created_at DESC
      LIMIT $${Object.keys(filters).length + 1} OFFSET $${Object.keys(filters).length + 2}
    `;

    // Get total count
    const countQuery = `
      WITH combined_history AS (
        ${activeSalesQuery.getQuery()}
        UNION ALL
        ${cancelledSalesQuery.getQuery()}
        UNION ALL
        ${purchasesQuery.getQuery()}
      )
      SELECT COUNT(*) as count FROM combined_history
      WHERE 1=1
      ${filters.search ? `AND (name ILIKE $${Object.keys(filters).indexOf('search') + 1} OR description ILIKE $${Object.keys(filters).indexOf('search') + 1})` : ''}
      ${filters.category_id ? `AND category_id = $${Object.keys(filters).indexOf('category_id') + 1}` : ''}
      ${filters.language_id ? `AND language_id = $${Object.keys(filters).indexOf('language_id') + 1}` : ''}
      ${filters.start_date ? `AND created_at >= $${Object.keys(filters).indexOf('start_date') + 1}` : ''}
      ${filters.end_date ? `AND created_at <= $${Object.keys(filters).indexOf('end_date') + 1}` : ''}
    `;

    // Prepare parameters
    const parameters = [
      ...(filters.search ? [`%${filters.search}%`, `%${filters.search}%`] : []),
      ...(filters.category_id ? [filters.category_id] : []),
      ...(filters.language_id ? [filters.language_id] : []),
      ...(filters.start_date ? [filters.start_date] : []),
      ...(filters.end_date ? [filters.end_date] : []),
      limit,
      skip
    ];

    // Execute queries
    const [results, [{ count }]] = await Promise.all([
      this.dataSource.query(combinedQuery, parameters),
      this.dataSource.query(countQuery, parameters.slice(0, -2))
    ]);

    const total = parseInt(count);

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
    };
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
    return this.dataSource
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
        'NULL as cancellation_reason'
      ])
      .from(Sale, 's')
      .where('s.seller_id = :userId OR s.buyer_id = :userId', { userId })
      .andWhere('s.status != :cancelledStatus', { cancelledStatus: SaleStatus.CANCELLED });
  }

  private getCancelledSalesQuery(userId: string, filters: SalesHistoryFilterDto): SelectQueryBuilder<any> {
    return this.dataSource
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
        'sc.cancellation_reason'
      ])
      .from('sales_cancelled', 'sc')
      .where('sc.seller_id = :userId OR sc.buyer_id = :userId', { userId });
  }

  private getPurchasesQuery(userId: string, filters: SalesHistoryFilterDto): SelectQueryBuilder<Purchase> {
    return this.dataSource
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
        'NULL as cancellation_reason'
      ])
      .from(Purchase, 'p')
      .where('p.user_id = :userId', { userId });
  }
} 