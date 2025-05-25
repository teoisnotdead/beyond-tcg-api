import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase } from './entities/purchase.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
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

  async findAllByUser(userId: string): Promise<Purchase[]> {
    return this.purchasesRepository.find({
      where: { user: { id: userId } },
      relations: ['sale', 'seller', 'category', 'language'],
      order: { created_at: 'DESC' },
    });
  }

  async findAllBySeller(sellerId: string): Promise<Purchase[]> {
    return this.purchasesRepository.find({
      where: { seller: { id: sellerId } },
      relations: ['sale', 'user', 'category', 'language'],
      order: { created_at: 'DESC' },
    });
  }
}
