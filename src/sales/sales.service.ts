import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PurchasesService } from '../purchases/purchases.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
    private readonly purchasesService: PurchasesService,
  ) {}

  async countActiveSalesByUser(userId: string): Promise<number> {
    return this.salesRepository.count({
      where: {
        seller: { id: userId },
        status: 'available',
      },
    });
  }

  async create(userId: string, createSaleDto: CreateSaleDto): Promise<Sale> {
    // Create a new sale for the user
    const sale = this.salesRepository.create({
      ...createSaleDto,
      seller: { id: userId },
      status: createSaleDto.status || 'available',
    });
    return this.salesRepository.save(sale);
  }

  async findAll(): Promise<Sale[]> {
    return this.salesRepository.find({ relations: ['seller', 'category', 'language'] });
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

  async remove(id: string): Promise<void> {
    const result = await this.salesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Sale not found');
    }
  }

  async reserveSale(saleId: string, buyerId: string) {
    const sale = await this.salesRepository.findOne({ where: { id: saleId } });
    if (!sale) throw new NotFoundException('Sale not found');
    if (sale.status !== 'available') throw new BadRequestException('Sale is not available');
    // Optionally, save buyerId in the sale
    sale.status = 'reserved';
    sale.reserved_at = new Date();
    await this.salesRepository.save(sale);
    // Notification logic here
    return { message: 'Sale reserved successfully' };
  }

  async shipSale(saleId: string, sellerId: string, shippingProofUrl: string) {
    const sale = await this.salesRepository.findOne({ where: { id: saleId } });
    if (!sale) throw new NotFoundException('Sale not found');
    if (sale.seller.id !== sellerId) throw new ForbiddenException('Not your sale');
    if (sale.status !== 'reserved') throw new BadRequestException('Sale is not reserved');
    sale.status = 'shipped';
    sale.shipping_proof_url = shippingProofUrl;
    sale.shipped_at = new Date();
    await this.salesRepository.save(sale);
    // Notification logic here
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
    // Optionally, validate if userId is the seller or the buyer
    if (sale.status !== 'reserved') throw new BadRequestException('Sale cannot be cancelled');
    sale.status = 'cancelled';
    sale.cancelled_at = new Date();
    await this.salesRepository.save(sale);
    // Notification logic here
    return { message: 'Sale cancelled' };
  }
}
