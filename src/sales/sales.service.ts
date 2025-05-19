import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PurchasesService } from '../purchases/purchases.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
    private readonly purchasesService: PurchasesService,
    @Inject(CloudinaryService)
    private cloudinaryService: CloudinaryService,
  ) {}

  async countActiveSalesByUser(userId: string): Promise<number> {
    return this.salesRepository.count({
      where: {
        seller: { id: userId },
        status: 'available',
      },
    });
  }

  async create(userId: string, createSaleDto: CreateSaleDto, image?: Express.Multer.File): Promise<Sale> {
    let imageUrl: string | undefined = undefined;
    let uploadedImageResult: any = null;
    try {
      if (image) {
        uploadedImageResult = await this.cloudinaryService.uploadImage(image, 'Beyond TCG/sales');
        imageUrl = uploadedImageResult.secure_url;
      }
      const sale = this.salesRepository.create({
        ...createSaleDto,
        seller: { id: userId },
        status: createSaleDto.status || 'available',
        image_url: imageUrl,
        category: { id: createSaleDto.category_id },
        language: { id: createSaleDto.language_id },
      });
      return await this.salesRepository.save(sale);
    } catch (error) {
      // if the image was uploaded but the sale failed, delete the image from Cloudinary
      if (uploadedImageResult && uploadedImageResult.public_id) {
        await this.cloudinaryService.deleteImage(uploadedImageResult.public_id);
      }
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 20, filters: Partial<Sale> = {}): Promise<{ data: Sale[]; total: number; page: number; totalPages: number }> {
    const [data, total] = await this.salesRepository.findAndCount({
      where: filters,
      relations: ['seller', 'category', 'language'],
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

  async findOne(id: string): Promise<Sale> {
    const sale = await this.salesRepository.findOne({
      where: { id },
      relations: ['seller', 'category', 'language'],
    });
    if (!sale) {
      throw new NotFoundException('Sale not found');
    }
    // Increment views
    sale.views += 1;
    await this.salesRepository.save(sale);
    return sale;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.salesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Sale not found');
    }
    return { message: 'Sale deleted successfully' };
  }

  async reserveSale(saleId: string, buyerId: string) {
    const sale = await this.salesRepository.findOne({ where: { id: saleId } });
    if (!sale) throw new NotFoundException('Sale not found');
    if (sale.status !== 'available') throw new BadRequestException('Sale is not available');
    sale.status = 'reserved';
    sale.reserved_at = new Date();
    await this.salesRepository.save(sale);
    return { message: 'Sale reserved successfully' };
  }

  async shipSale(saleId: string, sellerId: string, shippingProofUrl: string) {
    const sale = await this.salesRepository.findOne({ where: { id: saleId } });
    if (!sale) throw new NotFoundException('Sale not found');
    if (sale.seller.id !== sellerId) throw new ForbiddenException('You are not the seller of this sale');
    if (sale.status !== 'reserved') throw new BadRequestException('Sale is not reserved');
    sale.status = 'shipped';
    sale.shipping_proof_url = shippingProofUrl;
    sale.shipped_at = new Date();
    await this.salesRepository.save(sale);
    return { message: 'Sale marked as shipped' };
  }

  async confirmDelivery(saleId: string, buyerId: string, deliveryProofUrl: string) {
    const sale = await this.salesRepository.findOne({ where: { id: saleId }, relations: ['seller', 'category', 'language'] });
    if (!sale) throw new NotFoundException('Sale not found');
    // Optionally, validate that buyerId is the one who reserved the sale
    if (sale.status !== 'shipped') throw new BadRequestException('Sale is not shipped');
    sale.status = 'completed';
    sale.delivery_proof_url = deliveryProofUrl;
    sale.completed_at = new Date();
    await this.salesRepository.save(sale);

    // Create the purchase record
    await this.purchasesService.create(buyerId, {
      sale_id: sale.id,
      quantity: sale.quantity, // or the correct quantity
    });

    // Notification logic here
    return { message: 'Sale completed and purchase registered.' };
  }

  async cancelSale(saleId: string, userId: string) {
    const sale = await this.salesRepository.findOne({ where: { id: saleId } });
    if (!sale) throw new NotFoundException('Sale not found');
    if (sale.status !== 'reserved') throw new BadRequestException('Sale cannot be cancelled');
    sale.status = 'cancelled';
    sale.cancelled_at = new Date();
    await this.salesRepository.save(sale);
    return { message: 'Sale cancelled' };
  }

  async searchSales({ search, page = 1, limit = 20, offset, categories }: { search?: string; page?: number; limit?: number; offset?: number; categories?: string | string[] }) {
    // Calculate offset
    let skip = 0;
    if (typeof offset !== 'undefined') {
      skip = Number(offset);
    } else {
      skip = (Number(page) - 1) * Number(limit);
    }
    // Process categories
    let categoryIds: string[] | undefined = undefined;
    if (categories) {
      if (Array.isArray(categories)) {
        categoryIds = categories;
      } else {
        categoryIds = categories.split(',');
      }
    }
    // QueryBuilder
    const qb = this.salesRepository.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.seller', 'seller')
      .leftJoinAndSelect('sale.category', 'category')
      .leftJoinAndSelect('sale.language', 'language')
      .where('sale.status = :status', { status: 'available' });
    if (categoryIds && categoryIds.length > 0) {
      qb.andWhere('sale.category_id IN (:...categoryIds)', { categoryIds });
    }
    if (search) {
      qb.andWhere(`(
        sale.name ILIKE :search OR
        sale.description ILIKE :search OR
        seller.name ILIKE :search
      )`, { search: `%${search}%` });
    }
    qb.orderBy('sale.created_at', 'DESC')
      .skip(skip)
      .take(Number(limit));
    const [sales, total] = await qb.getManyAndCount();
    return {
      sales,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: typeof offset !== 'undefined' ? Math.floor(skip / Number(limit)) + 1 : Number(page),
      total
    };
  }

  async update(saleId: string, userId: string, updateSaleDto: any, image?: Express.Multer.File): Promise<Sale> {
    const sale = await this.salesRepository.findOne({ where: { id: saleId }, relations: ['seller'] });
    if (!sale) throw new NotFoundException('Sale not found');
    if (sale.seller.id !== userId) throw new ForbiddenException('You are not the seller of this sale');
    let uploadedImageResult: any = null;
    try {
      if (image) {
        uploadedImageResult = await this.cloudinaryService.updateImage(
          image,
          sale.image_url || null,
          'Beyond TCG/sales'
        );
        updateSaleDto.image_url = uploadedImageResult.secure_url;
      }
      Object.assign(sale, updateSaleDto);
      return await this.salesRepository.save(sale);
    } catch (error) {
      if (uploadedImageResult && uploadedImageResult.public_id) {
        await this.cloudinaryService.deleteImage(uploadedImageResult.public_id);
      }
      throw error;
    }
  }
}
