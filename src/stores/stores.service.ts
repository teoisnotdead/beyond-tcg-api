import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoreSocialLink } from './entities/store-social-link.entity';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Inject } from '@nestjs/common';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
    @InjectRepository(StoreSocialLink)
    private socialLinksRepository: Repository<StoreSocialLink>,
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
    @Inject(CloudinaryService)
    private cloudinaryService: CloudinaryService,
  ) { }

  async create(userId: string, createStoreDto: CreateStoreDto): Promise<Store> {
    // Check if the user already has a store
    const existing = await this.storesRepository.findOne({ where: { user: { id: userId } } });
    if (existing) {
      throw new BadRequestException('The user already has a store');
    }

    // Create the store
    const store = this.storesRepository.create({
      ...createStoreDto,
      user: { id: userId },
    });

    // If there are socialLinks, create the entities and associate them
    if (createStoreDto.socialLinks && createStoreDto.socialLinks.length > 0) {
      store.socialLinks = createStoreDto.socialLinks.map(link =>
        this.socialLinksRepository.create(link)
      );
    }

    return this.storesRepository.save(store);
  }

  async findAll(page: number = 1, limit: number = 20, filters: Partial<Store> = {}): Promise<{ data: Store[]; total: number; page: number; totalPages: number }> {
    const [data, total] = await this.storesRepository.findAndCount({
      where: filters,
      relations: ['user', 'socialLinks'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Store> {
    const store = await this.storesRepository.findOne({
      where: { id },
      relations: ['user', 'socialLinks'],
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  async getStatistics(storeId: string) {
    // 1. Total Sales & Revenue (Completed sales)
    const { totalSales, totalRevenue } = await this.salesRepository
      .createQueryBuilder('sale')
      .select('COUNT(sale.id)', 'totalSales')
      .addSelect('SUM(sale.price * sale.quantity)', 'totalRevenue')
      .where('sale.store_id = :storeId', { storeId })
      .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
      .getRawOne();

    // 2. Total Views (All sales)
    const { totalViews } = await this.salesRepository
      .createQueryBuilder('sale')
      .select('SUM(sale.views)', 'totalViews')
      .where('sale.store_id = :storeId', { storeId })
      .getRawOne();

    // 3. Total Favorites
    // We need to join with favorites. 
    // Note: This counts total favorites across all sales of the store.
    const { totalFavorites } = await this.salesRepository
      .createQueryBuilder('sale')
      .leftJoin(Favorite, 'favorite', 'favorite.saleId = sale.id')
      .select('COUNT(favorite.id)', 'totalFavorites')
      .where('sale.store_id = :storeId', { storeId })
      .getRawOne();

    // 4. Top Products (by sales count)
    const topProducts = await this.salesRepository
      .createQueryBuilder('sale')
      .select('sale.name', 'name')
      .addSelect('COUNT(sale.id)', 'sales')
      .addSelect('SUM(sale.price * sale.quantity)', 'revenue')
      // We can't easily get favorites count per product in the same query without subquery or complex group by
      // So we'll just get sales and revenue for now, or do a separate query/join.
      // Let's try to join favorites to get count per product.
      .leftJoin(Favorite, 'favorite', 'favorite.saleId = sale.id')
      .addSelect('COUNT(favorite.id)', 'favorites')
      .where('sale.store_id = :storeId', { storeId })
      .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
      .groupBy('sale.name')
      .orderBy('sales', 'DESC')
      .limit(5)
      .getRawMany();

    // 5. Sales by Month (Last 6 months)
    // This is database specific (PostgreSQL).
    const salesByMonth = await this.salesRepository.query(`
      SELECT 
        TO_CHAR(completed_at, 'YYYY-MM') as month,
        COUNT(id) as sales,
        SUM(price * quantity) as revenue
      FROM sales
      WHERE store_id = $1 
        AND status = $2
        AND completed_at >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month DESC
    `, [storeId, SaleStatus.COMPLETED]);

    // Fill in missing months if needed (optional, but good for charts)
    // For now, we return what the DB gives.

    return {
      totalSales: Number(totalSales || 0),
      totalRevenue: Number(totalRevenue || 0),
      totalViews: Number(totalViews || 0),
      totalFavorites: Number(totalFavorites || 0),
      topProducts: topProducts.map(p => ({
        name: p.name,
        sales: Number(p.sales),
        revenue: Number(p.revenue),
        favorites: Number(p.favorites)
      })),
      salesByMonth: salesByMonth.map((s: any) => ({
        month: s.month,
        sales: Number(s.sales),
        revenue: Number(s.revenue)
      }))
    };
  }

  async updateBranding(storeId: string, logoFile?: Express.Multer.File, bannerFile?: Express.Multer.File) {
    const store = await this.findOne(storeId);
    let updated = false;

    // Update logo if provided
    if (logoFile) {
      const logoResult: any = await this.cloudinaryService.updateImage(
        logoFile,
        store.avatar_url || null,
        'Beyond TCG/stores/logos'
      );
      store.avatar_url = logoResult.secure_url;
      updated = true;
    }

    // Update banner if provided
    if (bannerFile) {
      const bannerResult: any = await this.cloudinaryService.updateImage(
        bannerFile,
        store.banner_url || null,
        'Beyond TCG/stores/banners'
      );
      store.banner_url = bannerResult.secure_url;
      updated = true;
    }

    if (updated) {
      await this.storesRepository.save(store);
    }

    return {
      message: 'Branding actualizado',
      logo_url: store.avatar_url,
      banner_url: store.banner_url
    };
  }

  async searchStores({ search, page = 1, limit = 20, offset, locations }: { search?: string; page?: number; limit?: number; offset?: number; locations?: string | string[] }) {
    let skip = 0;
    if (typeof offset !== 'undefined') {
      skip = Number(offset);
    } else {
      skip = (Number(page) - 1) * Number(limit);
    }
    let locationList: string[] | undefined = undefined;
    if (locations) {
      if (Array.isArray(locations)) {
        locationList = locations;
      } else {
        locationList = locations.split(',');
      }
    }
    const qb = this.storesRepository.createQueryBuilder('store')
      .leftJoinAndSelect('store.user', 'user')
      .leftJoinAndSelect('store.socialLinks', 'socialLinks');
    if (locationList && locationList.length > 0) {
      qb.andWhere('store.location IN (:...locationList)', { locationList });
    }
    if (search) {
      qb.andWhere(`(
        store.name ILIKE :search OR
        store.description ILIKE :search OR
        user.name ILIKE :search
      )`, { search: `%${search}%` });
    }
    qb.orderBy('store.created_at', 'DESC')
      .skip(skip)
      .take(Number(limit));
    const [stores, total] = await qb.getManyAndCount();
    return {
      stores,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: typeof offset !== 'undefined' ? Math.floor(skip / Number(limit)) + 1 : Number(page),
      total
    };
  }
}
