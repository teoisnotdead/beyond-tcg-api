import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale, SaleStatus } from './entities/sale.entity';
import { ReserveSaleDto, ShipSaleDto, ConfirmDeliveryDto, CancelSaleDto } from './dto/change-sale-state.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SalesStateService {
  constructor(
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
    private dataSource: DataSource,
  ) {}

  private async validateSaleExists(saleId: string): Promise<Sale> {
    const sale = await this.salesRepository.findOne({
      where: { id: saleId },
      relations: ['seller', 'buyer', 'store'],
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return sale;
  }

  private async validateUserCanModifySale(sale: Sale, userId: string, requiredRole: 'seller' | 'buyer'): Promise<void> {
    if (requiredRole === 'seller' && sale.seller.id !== userId) {
      throw new ForbiddenException('Only the seller can perform this action');
    }
    if (requiredRole === 'buyer' && sale.buyer?.id !== userId) {
      throw new ForbiddenException('Only the buyer can perform this action');
    }
  }

  async reserveSale(dto: ReserveSaleDto, userId: string): Promise<Sale> {
    const sale = await this.validateSaleExists(dto.saleId);
    
    if (sale.status !== SaleStatus.AVAILABLE) {
      throw new BadRequestException('Sale is not available for reservation');
    }

    await this.validateUserCanModifySale(sale, userId, 'seller');

    const quantity = dto.quantity || sale.quantity;
    if (quantity > sale.quantity) {
      throw new BadRequestException('Requested quantity exceeds available stock');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (quantity < sale.quantity) {
        // Create a new sale for the remaining quantity
        const remainingSale = this.salesRepository.create({
          ...sale,
          id: undefined,
          quantity: sale.quantity - quantity,
          original_quantity: sale.original_quantity - quantity,
          parent_sale_id: sale.id,
        });
        await queryRunner.manager.save(remainingSale);
      }

      // Update the original sale
      sale.quantity = quantity;
      sale.status = SaleStatus.RESERVED;
      sale.buyer = { id: dto.buyerId } as User;
      sale.reserved_at = new Date();
      
      const updatedSale = await queryRunner.manager.save(sale);
      await queryRunner.commitTransaction();
      
      return updatedSale;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async shipSale(dto: ShipSaleDto, userId: string): Promise<Sale> {
    const sale = await this.validateSaleExists(dto.saleId);
    
    if (sale.status !== SaleStatus.RESERVED) {
      throw new BadRequestException('Sale must be reserved before shipping');
    }

    await this.validateUserCanModifySale(sale, userId, 'seller');

    sale.status = SaleStatus.SHIPPED;
    sale.shipping_proof_url = dto.shippingProofUrl;
    sale.shipped_at = new Date();

    return this.salesRepository.save(sale);
  }

  async confirmDelivery(dto: ConfirmDeliveryDto, userId: string): Promise<Sale> {
    const sale = await this.validateSaleExists(dto.saleId);
    
    if (sale.status !== SaleStatus.SHIPPED) {
      throw new BadRequestException('Sale must be shipped before confirming delivery');
    }

    await this.validateUserCanModifySale(sale, userId, 'buyer');

    sale.status = SaleStatus.DELIVERED;
    sale.delivery_proof_url = dto.deliveryProofUrl;
    sale.delivered_at = new Date();

    return this.salesRepository.save(sale);
  }

  async completeSale(saleId: string, userId: string): Promise<Sale> {
    const sale = await this.validateSaleExists(saleId);
    
    if (sale.status !== SaleStatus.DELIVERED) {
      throw new BadRequestException('Sale must be delivered before completing');
    }

    await this.validateUserCanModifySale(sale, userId, 'seller');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create purchase record
      await queryRunner.manager.query(`
        INSERT INTO purchases (
          id, user_id, sale_id, seller_id, name, description, 
          price, image_url, quantity, language_id, category_id, created_at
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
        )
      `, [
        sale.buyer.id,
        sale.id,
        sale.seller.id,
        sale.name,
        sale.description,
        sale.price,
        sale.image_url,
        sale.quantity,
        sale.language.id,
        sale.category.id
      ]);

      // Update sale status
      sale.status = SaleStatus.COMPLETED;
      sale.completed_at = new Date();
      
      const updatedSale = await queryRunner.manager.save(sale);
      await queryRunner.commitTransaction();
      
      return updatedSale;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelSale(dto: CancelSaleDto, userId: string): Promise<Sale> {
    const sale = await this.validateSaleExists(dto.saleId);
    
    if (sale.status === SaleStatus.COMPLETED || sale.status === SaleStatus.CANCELLED) {
      throw new BadRequestException('Cannot cancel a completed or already cancelled sale');
    }

    // Only seller or buyer can cancel
    if (sale.seller.id !== userId && sale.buyer?.id !== userId) {
      throw new ForbiddenException('Only the seller or buyer can cancel the sale');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create record in sales_cancelled
      await queryRunner.manager.query(`
        INSERT INTO sales_cancelled (
          id, original_sale_id, parent_sale_id, seller_id, buyer_id, store_id,
          name, description, price, image_url, quantity, original_quantity,
          category_id, language_id, cancellation_reason, cancelled_at, created_at,
          original_status
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), $15, $16
        )
      `, [
        sale.id,
        sale.parent_sale_id,
        sale.seller.id,
        sale.buyer?.id,
        sale.store_id,
        sale.name,
        sale.description,
        sale.price,
        sale.image_url,
        sale.quantity,
        sale.original_quantity,
        sale.category.id,
        sale.language.id,
        dto.reason,
        sale.created_at,
        sale.status
      ]);

      // If there's a parent sale, update its quantity
      if (sale.parent_sale_id) {
        await queryRunner.manager.query(`
          UPDATE sales 
          SET quantity = quantity + $1
          WHERE id = $2
        `, [sale.quantity, sale.parent_sale_id]);
      }

      // Delete the original sale
      await queryRunner.manager.remove(sale);
      await queryRunner.commitTransaction();
      
      return sale;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
} 