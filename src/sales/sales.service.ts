import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PurchasesService } from '../purchases/purchases.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateSaleDto } from './dto/update-sale.dto';

export interface SaleListItem {
  id: string;
  seller: { id: string };
  store_id?: string | null;
  name: string;
  description: string;
  price: string | number;
  image_url?: string | null;
  quantity: number;
  status: string;
  views: number;
  category: { id: string } | null;
  language: { id: string } | null;
  shipping_proof_url?: string | null;
  delivery_proof_url?: string | null;
  reserved_at?: Date | null;
  shipped_at?: Date | null;
  delivered_at?: Date | null;
  completed_at?: Date | null;
  cancelled_at?: Date | null;
  created_at: Date;
}

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

  async findAll(
    page: number = 1,
    limit: number = 20,
    filters: any = {}
  ): Promise<{ data: SaleListItem[]; total: number; page: number; totalPages: number }> {
    let skip = (page - 1) * limit;

    const qb = this.salesRepository.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.seller', 'seller')
      .leftJoinAndSelect('sale.category', 'category')
      .leftJoinAndSelect('sale.language', 'language')
      .andWhere('sale.status = :status', { status: 'available' });

    // Filter by category
    if (filters.categories) {
      const categoryIds = Array.isArray(filters.categories)
        ? filters.categories
        : filters.categories.split(',');
      qb.andWhere('sale.category_id IN (:...categoryIds)', { categoryIds });
    }

    // Filter by language
    if (filters.language_id) {
      const languageIds = Array.isArray(filters.language_id)
        ? filters.language_id
        : filters.language_id.split(',');
      qb.andWhere('sale.language_id IN (:...languageIds)', { languageIds });
    }

    // Filter by search text
    if (filters.search) {
      qb.andWhere(`(
        sale.name ILIKE :search OR
        sale.description ILIKE :search
      )`, { search: `%${filters.search}%` });
    }

    qb.orderBy('sale.created_at', 'DESC')
      .skip(skip)
      .take(Number(limit));

    const [sales, total] = await qb.getManyAndCount();

    return {
      data: sales.map(sale => ({
        ...sale,
        seller: { id: sale.seller.id },
        category: sale.category ? { id: sale.category.id } : null,
        language: sale.language ? { id: sale.language.id } : null,
      })),
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
    const sale = await this.salesRepository.findOne({ 
      where: { id: saleId },
      relations: ['seller', 'buyer'] 
    });
    
    if (!sale) throw new NotFoundException('Sale not found');
    if (sale.status !== 'available') throw new BadRequestException('Sale is not available');
    if (sale.seller.id === buyerId) throw new ForbiddenException('You cannot reserve your own sale');
    if (sale.buyer_id) throw new BadRequestException('Sale is already reserved by another user');
    
    sale.status = 'reserved';
    sale.buyer_id = buyerId;
    sale.reserved_at = new Date();
    await this.salesRepository.save(sale);
    return { message: 'Sale reserved successfully' };
  }

  async shipSale(saleId: string, sellerId: string, shippingProofUrl: string) {
    const sale = await this.salesRepository.findOne({ 
      where: { id: saleId },
      relations: ['seller', 'buyer'] 
    });
    
    if (!sale) throw new NotFoundException('Sale not found');
    if (sale.seller.id !== sellerId) throw new ForbiddenException('Only the seller can mark the sale as shipped');
    if (sale.status !== 'reserved') throw new BadRequestException('Sale must be reserved before shipping');
    if (!sale.buyer_id) throw new BadRequestException('Sale must have a buyer to be shipped');
    
    sale.status = 'shipped';
    sale.shipping_proof_url = shippingProofUrl;
    sale.shipped_at = new Date();
    await this.salesRepository.save(sale);
    return { message: 'Sale marked as shipped' };
  }

  async confirmDelivery(saleId: string, buyerId: string, deliveryProofUrl: string) {
    const sale = await this.salesRepository.findOne({ 
      where: { id: saleId }, 
      relations: ['seller', 'buyer'] 
    });
    
    if (!sale) throw new NotFoundException('Sale not found');
    if (sale.seller.id === buyerId) throw new ForbiddenException('You cannot confirm delivery of your own sale');
    if (sale.status !== 'shipped') throw new BadRequestException('Sale must be shipped before confirming delivery');
    if (sale.buyer_id !== buyerId) throw new ForbiddenException('Only the buyer can confirm delivery');
    
    sale.status = 'completed';
    sale.delivery_proof_url = deliveryProofUrl;
    sale.completed_at = new Date();
    await this.salesRepository.save(sale);

    // Create the purchase record
    await this.purchasesService.create(buyerId, {
      sale_id: sale.id,
      quantity: sale.quantity,
    });

    return { message: 'Sale completed and purchase registered.' };
  }

  async cancelSale(saleId: string, userId: string) {
    const sale = await this.salesRepository.findOne({ 
      where: { id: saleId },
      relations: ['seller', 'buyer'] 
    });
    
    if (!sale) throw new NotFoundException('Sale not found');
    
    // Solo permitir cancelar si está reservada
    if (sale.status !== 'reserved') {
      throw new BadRequestException('Only reserved sales can be cancelled');
    }
    
    // Solo el vendedor o el comprador pueden cancelar
    if (sale.seller.id !== userId && sale.buyer_id !== userId) {
      throw new ForbiddenException('Only the seller or buyer can cancel this sale');
    }
    
    sale.status = 'cancelled';
    sale.cancelled_at = new Date();
    // No limpiamos el buyer_id para mantener el historial
    await this.salesRepository.save(sale);
    return { message: 'Sale cancelled successfully' };
  }

  async searchSales({ search, page = 1, limit = 20, offset, categories }: { search?: string; page?: number; limit?: number; offset?: number; categories?: string | string[] }): Promise<{ sales: SaleListItem[]; totalPages: number; currentPage: number; total: number }> {
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
      .andWhere('sale.status = :status', { status: 'available' });
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
      sales: sales.map(sale => ({
        ...sale,
        seller: { id: sale.seller.id },
        category: sale.category ? { id: sale.category.id } : null,
        language: sale.language ? { id: sale.language.id } : null,
      })),
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: typeof offset !== 'undefined' ? Math.floor(skip / Number(limit)) + 1 : Number(page),
      total
    };
  }

  async update(saleId: string, userId: string, updateSaleDto: UpdateSaleDto, image?: Express.Multer.File): Promise<any> {
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
      const savedSale = await this.salesRepository.save(sale);
      return {
        ...savedSale,
        seller: { id: savedSale.seller.id },
      };
    } catch (error) {
      if (uploadedImageResult && uploadedImageResult.public_id) {
        await this.cloudinaryService.deleteImage(uploadedImageResult.public_id);
      }
      throw error;
    }
  }

  async relistSale(saleId: string, sellerId: string, updateData?: Partial<CreateSaleDto>) {
    // Buscar la venta original
    const originalSale = await this.salesRepository.findOne({
      where: { id: saleId },
      relations: ['seller', 'category', 'language']
    });

    if (!originalSale) {
      throw new NotFoundException('Original sale not found');
    }

    // Verificar que la venta esté cancelada
    if (originalSale.status !== 'cancelled') {
      throw new BadRequestException('Only cancelled sales can be relisted');
    }

    // Verificar que el usuario sea el vendedor original
    if (originalSale.seller.id !== sellerId) {
      throw new ForbiddenException('Only the original seller can relist this sale');
    }

    // Crear nueva venta basada en la original
    const newSale = this.salesRepository.create({
      seller: { id: sellerId },
      store_id: originalSale.store_id,
      name: updateData?.name || originalSale.name,
      description: updateData?.description || originalSale.description,
      price: updateData?.price || originalSale.price,
      image_url: originalSale.image_url, // Mantener la misma imagen
      quantity: updateData?.quantity || originalSale.quantity,
      status: 'available',
      category: { id: updateData?.category_id || originalSale.category.id },
      language: { id: updateData?.language_id || originalSale.language.id },
      views: 0, // Resetear vistas
      // No copiamos los campos de comprobantes ni timestamps
    });

    // Guardar la nueva venta
    const savedSale = await this.salesRepository.save(newSale);

    return {
      message: 'Sale relisted successfully',
      data: {
        ...savedSale,
        seller: { id: savedSale.seller.id },
        category: savedSale.category ? { id: savedSale.category.id } : null,
        language: savedSale.language ? { id: savedSale.language.id } : null,
      }
    };
  }
}
