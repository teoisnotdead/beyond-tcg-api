import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoreSocialLink } from './entities/store-social-link.entity';
import { Sale } from '../sales/entities/sale.entity';
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
  ) {}

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

  async findAll(): Promise<Store[]> {
    return this.storesRepository.find({ relations: ['user', 'socialLinks'] });
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
    // Get all sales of the store
    const sales = await this.salesRepository.find({ where: { store_id: storeId } });
    const saleIds = sales.map(s => s.id);

    // Total sales (completed)
    const totalSales = sales.filter(s => s.status === 'completed').length;
    // Revenue
    const totalRevenue = sales.filter(s => s.status === 'completed').reduce((acc, s) => acc + Number(s.price) * s.quantity, 0);
    // Total views
    const totalViews = sales.reduce((acc, s) => acc + (s.views || 0), 0);
    // Favorites received (using queryBuilder for multiple sales)
    let totalFavorites = 0;
    if (saleIds.length > 0) {
      const result = await this.favoriteRepository.createQueryBuilder('favorite')
        .where('favorite.saleId IN (:...saleIds)', { saleIds })
        .getCount();
      totalFavorites = result;
    }
    // Top products
    const productStats: Record<string, { sales: number; revenue: number; favorites: number }> = {};
    for (const s of sales) {
      if (!productStats[s.name]) productStats[s.name] = { sales: 0, revenue: 0, favorites: 0 };
      if (s.status === 'completed') productStats[s.name].sales += 1;
      if (s.status === 'completed') productStats[s.name].revenue += Number(s.price) * s.quantity;
    }
    // Favorites per product
    if (saleIds.length > 0) {
      const favoritesBySale = await this.favoriteRepository.createQueryBuilder('favorite')
        .select('favorite.saleId', 'saleId')
        .addSelect('COUNT(*)', 'count')
        .where('favorite.saleId IN (:...saleIds)', { saleIds })
        .groupBy('favorite.saleId')
        .getRawMany();
      for (const fav of favoritesBySale) {
        const sale = sales.find(s => s.id === fav.saleId);
        if (sale && productStats[sale.name]) {
          productStats[sale.name].favorites = Number(fav.count);
        }
      }
    }
    const topProducts = Object.entries(productStats)
      .map(([name, stats]) => ({ name, sales: stats.sales, revenue: stats.revenue, favorites: stats.favorites }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
    // Sales by month (last 6 months)
    const now = new Date();
    const salesByMonth: { month: string; sales: number; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = month.toISOString().slice(0, 7);
      const salesInMonth = sales.filter(s => s.status === 'completed' && s.completed_at && s.completed_at.toISOString().slice(0, 7) === monthStr);
      salesByMonth.push({
        month: monthStr,
        sales: salesInMonth.length,
        revenue: salesInMonth.reduce((acc, s) => acc + Number(s.price) * s.quantity, 0)
      });
    }
    return {
      totalSales,
      totalRevenue,
      totalViews,
      totalFavorites,
      topProducts,
      salesByMonth
    };
  }

  async updateBranding(storeId: string, logoFile?: Express.Multer.File, bannerFile?: Express.Multer.File) {
    const store = await this.findOne(storeId);
    let updated = false;
    // Subir logo si viene
    if (logoFile) {
      const logoResult: any = await this.cloudinaryService.uploadImage(logoFile, 'Beyond TCG/stores/logos');
      store.avatar_url = logoResult.secure_url;
      updated = true;
    }
    // Subir banner si viene
    if (bannerFile) {
      const bannerResult: any = await this.cloudinaryService.uploadImage(bannerFile, 'Beyond TCG/stores/banners');
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
}
