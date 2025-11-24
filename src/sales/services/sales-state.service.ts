import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale, SaleStatus } from '../entities/sale.entity';
import { ReserveSaleDto, ShipSaleDto, ConfirmDeliveryDto, CancelSaleDto } from '../dto/change-sale-state.dto';
import { User } from '../../users/entities/user.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/entities/notification.entity';

@Injectable()
export class SalesStateService {
  constructor(
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
    private dataSource: DataSource,
    private notificationsService: NotificationsService,
  ) {}

  private async validateSaleExists(saleId: string): Promise<Sale> {
    const sale = await this.salesRepository.findOne({
      where: { id: saleId },
      relations: ['seller', 'buyer', 'store'],
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }
    if (!sale.seller) {
      throw new ForbiddenException('Sale has no seller assigned');
    }
    return sale;
  }

  private async validateUserCanModifySale(sale: Sale, userId: string, requiredRole: 'seller' | 'buyer'): Promise<void> {
    if (requiredRole === 'seller') {
      if (!sale.seller || !sale.seller.id) {
        throw new ForbiddenException('Sale has no seller assigned');
      }
      if (sale.seller.id !== userId) {
        throw new ForbiddenException('Only the seller can perform this action');
      }
    }
    if (requiredRole === 'buyer') {
      if (!sale.buyer || !sale.buyer?.id) {
        throw new ForbiddenException('Sale has no buyer assigned');
      }
      if (sale.buyer?.id !== userId) {
        throw new ForbiddenException('Only the buyer can perform this action');
      }
    }
  }

  async reserveSale(dto: ReserveSaleDto, userId: string): Promise<Sale> {
    const sale = await this.validateSaleExists(dto.saleId);

    if (sale.status !== SaleStatus.AVAILABLE) {
      throw new BadRequestException('Sale must be available to be reserved');
    }

    if (sale.seller?.id === userId) {
      throw new BadRequestException('Seller cannot reserve their own sale');
    }

    if (sale.buyer_id) {
      throw new BadRequestException('Sale is already reserved');
    }

    // Validar cantidad si se proporciona
    const quantity = dto.quantity || sale.quantity;
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }
    if (quantity > sale.quantity) {
      throw new BadRequestException('Requested quantity exceeds available stock');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Si la cantidad solicitada es menor que la disponible, creamos una nueva venta
      if (quantity < sale.quantity) {
        // Create a new sale for the remaining quantity
        const remainingSale = this.salesRepository.create({
          ...sale,
          id: undefined, // Will be automatically generated
          parent_sale_id: sale.id,
          quantity: sale.quantity - quantity,
          original_quantity: sale.quantity - quantity,
          status: SaleStatus.AVAILABLE,
          created_at: new Date()
        });
        await queryRunner.manager.save(remainingSale);
      }

      // Update the original sale
      sale.status = SaleStatus.RESERVED;
      sale.buyer_id = userId;
      sale.reserved_at = new Date();
      sale.quantity = quantity;
      sale.reserved_quantity = quantity;
      await queryRunner.manager.save(sale);
      await queryRunner.commitTransaction();

      // Then reload the sale with all necessary relations
      const finalSale = await this.salesRepository
        .createQueryBuilder('sale')
        .leftJoinAndSelect('sale.seller', 'seller')
        .leftJoinAndSelect('sale.buyer', 'buyer')
        .leftJoinAndSelect('sale.store', 'store')
        .leftJoinAndSelect('sale.category', 'category')
        .leftJoinAndSelect('sale.language', 'language')
        .where('sale.id = :id', { id: sale.id })
        .getOne();

      if (!finalSale) {
        throw new NotFoundException('Sale not found after update');
      }

      // Ensure the buyer object is present
      if (!finalSale.buyer && finalSale.buyer_id) {
        const buyer = await queryRunner.manager.findOne(User, { where: { id: finalSale.buyer_id } });
        if (buyer) {
          finalSale.buyer = buyer;
        }
      }

      // Notify the seller
      await this.notificationsService.create({
        user_id: sale.seller.id,
        type: NotificationType.SALE_RESERVED,
        metadata: { saleId: sale.id, status: SaleStatus.RESERVED }
      });

      return finalSale;
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
    if (!sale.buyer || !sale.buyer?.id) {
      throw new BadRequestException('Sale has no buyer assigned');
    }
    await this.validateUserCanModifySale(sale, userId, 'seller');
    sale.status = SaleStatus.SHIPPED;
    sale.shipping_proof_url = dto.shippingProofUrl;
    sale.shipped_at = new Date();
    const updatedSale = await this.salesRepository.save(sale);

    // Notificar al comprador
    if (sale.buyer_id) {
      await this.notificationsService.create({
        user_id: sale.buyer_id,
        type: NotificationType.SALE_SHIPPED,
        metadata: { saleId: sale.id, status: SaleStatus.SHIPPED }
      });
    }

    return updatedSale;
  }

  async confirmDelivery(dto: ConfirmDeliveryDto, userId: string): Promise<Sale> {
    const sale = await this.validateSaleExists(dto.saleId);
    
    if (sale.status !== SaleStatus.SHIPPED) {
      throw new BadRequestException('Sale must be shipped before confirming delivery');
    }
    if (!sale.buyer || !sale.buyer?.id) {
      throw new BadRequestException('Sale has no buyer assigned');
    }
    await this.validateUserCanModifySale(sale, userId, 'buyer');
    sale.reserved_quantity = sale.reserved_quantity ?? sale.quantity;
    sale.status = SaleStatus.DELIVERED;
    sale.delivery_proof_url = dto.deliveryProofUrl;
    sale.delivered_at = new Date();
    const updatedSale = await this.salesRepository.save(sale);

    // Notificar al vendedor que fue entregada
    await this.notificationsService.create({
      user_id: sale.seller.id,
      type: NotificationType.SALE_DELIVERED,
      metadata: { saleId: sale.id, status: SaleStatus.DELIVERED }
    });

    // Schedule automatic transition to COMPLETED
    setTimeout(async () => {
      try {
        await this.automaticallyCompleteSale(sale.id);
      } catch (error) {
      }
    }, 60 * 1000); // 1 minute

    return updatedSale;
  }

  private async automaticallyCompleteSale(saleId: string): Promise<Sale> {
    // Load the sale with all necessary relations
    const sale = await this.salesRepository.findOne({
      where: { id: saleId },
      relations: ['seller', 'buyer', 'language', 'category'],
    });
    if (!sale) {
      throw new NotFoundException('Sale not found');
    }
    if (sale.status !== SaleStatus.DELIVERED) {
      return sale;
    }

    const quantityToRecord = sale.reserved_quantity ?? sale.quantity;

    sale.status = SaleStatus.COMPLETED;
    sale.completed_at = new Date();
    const updatedSale = await this.salesRepository.save(sale);

    //Create the purchase record
    if (sale.buyer && sale.buyer.id) {
      await this.dataSource.query(`
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
        quantityToRecord,
        sale.language.id,
        sale.category.id
      ]);
    }

    // Notify the seller that it was completed
    await this.notificationsService.create({
      user_id: sale.seller.id,
      type: NotificationType.SALE_COMPLETED,
      metadata: { saleId: sale.id, status: SaleStatus.COMPLETED }
    });

    return updatedSale;
  }

  async completeSale(saleId: string, userId: string): Promise<Sale> {
    const sale = await this.validateSaleExists(saleId);
   
    if (sale.status !== SaleStatus.DELIVERED) {
      throw new BadRequestException('Sale must be delivered before completing');
    }
    if (!sale.buyer || !sale.buyer?.id) {
      throw new BadRequestException('Sale has no buyer assigned');
    }
    await this.validateUserCanModifySale(sale, userId, 'seller');
    const quantityToRecord = sale.reserved_quantity ?? sale.quantity;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.query(`
        INSERT INTO purchases (
          id, user_id, sale_id, seller_id, name, description, 
          price, image_url, quantity, language_id, category_id, created_at
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
        )
      `, [
        sale.buyer?.id,
        sale.id,
        sale.seller.id,
        sale.name,
        sale.description,
        sale.price,
        sale.image_url,
        quantityToRecord,
        sale.language.id,
        sale.category.id
      ]);
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
    if ((!sale.seller || sale.seller.id !== userId) && (!sale.buyer || !sale.buyer?.id || sale.buyer?.id !== userId)) {
      throw new ForbiddenException('Only the seller or buyer can cancel the sale');
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
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
      if (sale.parent_sale_id) {
        await queryRunner.manager.query(`
          UPDATE sales 
          SET quantity = quantity + $1
          WHERE id = $2
        `, [sale.quantity, sale.parent_sale_id]);
      }
      await queryRunner.manager.remove(sale);
      await queryRunner.commitTransaction();

      // Notify the seller and buyer if they exist
      if (sale.seller?.id) {
        await this.notificationsService.create({
          user_id: sale.seller.id,
          type: NotificationType.SALE_CANCELLED,
          metadata: { saleId: sale.id, status: SaleStatus.CANCELLED }
        });
      }
      if (sale.buyer_id) {
        await this.notificationsService.create({
          user_id: sale.buyer_id,
          type: NotificationType.SALE_CANCELLED,
          metadata: { saleId: sale.id, status: SaleStatus.CANCELLED }
        });
      }

      return sale;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
} 