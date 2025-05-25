import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, ILike } from 'typeorm';
import { Purchase } from './entities/purchase.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { FindPurchasesDto, PurchaseSortField, SortOrder } from './dto/find-purchases.dto';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private purchasesRepository: Repository<Purchase>,
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
  ) {}

  async create(userId: string, createPurchaseDto: CreatePurchaseDto): Promise<Purchase> {
    const sale = await this.salesRepository.findOne({
      where: { id: createPurchaseDto.sale_id },
      relations: ['seller', 'category', 'language'],
    });
    if (!sale) throw new NotFoundException('Sale not found');
    if (sale.status !== SaleStatus.AVAILABLE && 
        sale.status !== SaleStatus.RESERVED && 
        sale.status !== SaleStatus.SHIPPED) {
      throw new BadRequestException('Sale is not available for purchase');
    }
    if (sale.quantity < createPurchaseDto.quantity) {
      throw new BadRequestException('Not enough stock');
    }

    // Update sale quantity and status
    sale.quantity -= createPurchaseDto.quantity;
    if (sale.quantity === 0) {
      sale.status = SaleStatus.COMPLETED;
    }
    await this.salesRepository.save(sale);

    // Create purchase record (snapshot of sale)
    const purchase = this.purchasesRepository.create({
      user: { id: userId },
      sale: { id: sale.id },
      seller: { id: sale.seller.id },
      name: sale.name,
      description: sale.description,
      price: sale.price,
      image_url: sale.image_url,
      quantity: createPurchaseDto.quantity,
      language: sale.language,
      category: sale.category,
    });
    return this.purchasesRepository.save(purchase);
  }

  async findAllByUser(userId: string, filters: FindPurchasesDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const queryBuilder = this.purchasesRepository.createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.sale', 'sale')
      .leftJoinAndSelect('purchase.seller', 'seller')
      .leftJoinAndSelect('purchase.category', 'category')
      .leftJoinAndSelect('purchase.language', 'language')
      .where('purchase.user_id = :userId', { userId });

    this.applyFilters(queryBuilder, filters);
    this.applySorting(queryBuilder, filters);

    const [purchases, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: purchases,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findAllBySeller(sellerId: string, filters: FindPurchasesDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const queryBuilder = this.purchasesRepository.createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.sale', 'sale')
      .leftJoinAndSelect('purchase.user', 'user')
      .leftJoinAndSelect('purchase.category', 'category')
      .leftJoinAndSelect('purchase.language', 'language')
      .where('purchase.seller_id = :sellerId', { sellerId });

    this.applyFilters(queryBuilder, filters);
    this.applySorting(queryBuilder, filters);

    const [purchases, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: purchases,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  private applyFilters(queryBuilder: any, filters: FindPurchasesDto) {
    if (filters.search) {
      queryBuilder.andWhere(
        '(purchase.name ILIKE :search OR purchase.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.categoryId) {
      queryBuilder.andWhere('purchase.category_id = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.languageId) {
      queryBuilder.andWhere('purchase.language_id = :languageId', { languageId: filters.languageId });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('purchase.created_at BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate
      });
    }

    if (filters.minPrice !== undefined) {
      queryBuilder.andWhere('purchase.price >= :minPrice', { minPrice: filters.minPrice });
    }

    if (filters.maxPrice !== undefined) {
      queryBuilder.andWhere('purchase.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }
  }

  private applySorting(queryBuilder: any, filters: FindPurchasesDto) {
    const orderBy = filters.sortBy ?? PurchaseSortField.CREATED_AT;
    const order = filters.sortOrder ?? SortOrder.DESC;
    
    queryBuilder.orderBy(`purchase.${orderBy}`, order);
  }
}
