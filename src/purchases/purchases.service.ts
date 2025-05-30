import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, ILike } from 'typeorm';
import { Purchase } from './entities/purchase.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { FindPurchasesDto, PurchaseSortField, SortOrder } from './dto/find-purchases.dto';
import { PurchaseDetailDto, UserBasicInfoDto, SaleBasicInfoDto } from './dto/purchase-detail.dto';
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

  async findOneDetailed(purchaseId: string, userId: string): Promise<PurchaseDetailDto> {
    const purchase = await this.purchasesRepository.findOne({
      where: { id: purchaseId },
      relations: [
        'user',
        'seller',
        'sale',
        'category',
        'language'
      ],
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    // Verify user has permission to view this purchase
    if (purchase.user.id !== userId && purchase.seller.id !== userId) {
      throw new ForbiddenException('You do not have permission to view this purchase');
    }

    // Get updated sale information
    const sale = await this.salesRepository.findOne({
      where: { id: purchase.sale.id },
      select: ['id', 'status', 'quantity', 'created_at', 'shipping_proof_url', 'delivery_proof_url', 'shipped_at', 'delivered_at', 'completed_at']
    });

    if (!sale) {
      throw new NotFoundException('Associated sale not found');
    }

    // Mapear a DTOs
    const userBasicInfo: UserBasicInfoDto = {
      id: purchase.user.id,
      name: purchase.user.name,
      avatar_url: purchase.user.avatar_url
    };

    const sellerBasicInfo: UserBasicInfoDto = {
      id: purchase.seller.id,
      name: purchase.seller.name,
      avatar_url: purchase.seller.avatar_url
    };

    const saleBasicInfo: SaleBasicInfoDto = {
      id: sale.id,
      status: sale.status,
      remaining_quantity: sale.quantity,
      created_at: sale.created_at
    };

    return {
      id: purchase.id,
      user: userBasicInfo,
      seller: sellerBasicInfo,
      sale: saleBasicInfo,
      name: purchase.name,
      description: purchase.description,
      price: purchase.price,
      quantity: purchase.quantity,
      total_price: Number(purchase.price) * purchase.quantity,
      image_url: purchase.image_url,
      category: purchase.category,
      language: purchase.language,
      created_at: purchase.created_at,
      shipping_status: sale.status,
      shipping_proof_url: sale.shipping_proof_url,
      shipped_at: sale.shipped_at,
      delivery_proof_url: sale.delivery_proof_url,
      delivered_at: sale.delivered_at,
      completed_at: sale.completed_at
    };
  }
}
