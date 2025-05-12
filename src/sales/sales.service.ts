import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
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
    // Aquí podrías guardar el buyerId en la venta si quieres
    sale.status = 'reserved';
    sale.reserved_at = new Date();
    await this.salesRepository.save(sale);
    // Aquí puedes crear la notificación
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
    // Notificación aquí
    return { message: 'Sale marked as shipped' };
  }

  async confirmDelivery(saleId: string, buyerId: string, deliveryProofUrl: string) {
    const sale = await this.salesRepository.findOne({ where: { id: saleId } });
    if (!sale) throw new NotFoundException('Sale not found');
    // Aquí deberías validar que el buyerId es el que reservó la venta
    if (sale.status !== 'shipped') throw new BadRequestException('Sale is not shipped');
    sale.status = 'delivered';
    sale.delivery_proof_url = deliveryProofUrl;
    sale.delivered_at = new Date();
    await this.salesRepository.save(sale);
    // Notificación aquí
    return { message: 'Sale marked as delivered' };
  }

  async cancelSale(saleId: string, userId: string) {
    const sale = await this.salesRepository.findOne({ where: { id: saleId } });
    if (!sale) throw new NotFoundException('Sale not found');
    // Aquí puedes validar si el userId es el vendedor o el comprador
    if (sale.status !== 'reserved') throw new BadRequestException('Sale cannot be cancelled');
    sale.status = 'cancelled';
    sale.cancelled_at = new Date();
    await this.salesRepository.save(sale);
    // Notificación aquí
    return { message: 'Sale cancelled' };
  }
}
