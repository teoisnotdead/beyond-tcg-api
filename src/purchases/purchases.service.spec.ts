import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { Purchase } from './entities/purchase.entity';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';

const createSale = (overrides: Partial<Sale> = {}): Sale => ({
  id: 'sale-id',
  status: SaleStatus.RESERVED,
  buyer_id: 'buyer-id',
  seller: { id: 'seller-id' } as any,
  name: 'Test Sale',
  description: 'Desc',
  price: 10,
  image_url: 'image',
  quantity: 2,
  language: { id: 'lang-id' } as any,
  category: { id: 'cat-id' } as any,
  original_quantity: 2,
  views: 0,
  created_at: new Date(),
  ...overrides,
} as Sale);

describe('PurchasesService', () => {
  let service: PurchasesService;
  let purchasesRepository: { create: jest.Mock; save: jest.Mock };
  let salesRepository: { findOne: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    purchasesRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    salesRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasesService,
        { provide: getRepositoryToken(Purchase), useValue: purchasesRepository },
        { provide: getRepositoryToken(Sale), useValue: salesRepository },
      ],
    }).compile();

    service = module.get<PurchasesService>(PurchasesService);
  });

  describe('create', () => {
    it('should forbid purchasing a reserved sale by another buyer', async () => {
      salesRepository.findOne.mockResolvedValue(
        createSale({ status: SaleStatus.RESERVED, buyer_id: 'original-buyer' }),
      );

      await expect(
        service.create('other-user', { sale_id: 'sale-id', quantity: 1 } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(salesRepository.save).not.toHaveBeenCalled();
      expect(purchasesRepository.save).not.toHaveBeenCalled();
    });

    it('should allow the assigned buyer to purchase a reserved sale', async () => {
      const sale = createSale({ status: SaleStatus.RESERVED, buyer_id: 'buyer-id' });
      salesRepository.findOne.mockResolvedValue(sale);
      purchasesRepository.create.mockImplementation((data) => ({ id: 'purchase-id', ...data }));
      purchasesRepository.save.mockImplementation((purchase) => Promise.resolve(purchase));
      salesRepository.save.mockResolvedValue({ ...sale });

      const purchase = await service.create('buyer-id', { sale_id: 'sale-id', quantity: 1 } as any);

      expect(purchase.id).toBe('purchase-id');
      expect(sale.quantity).toBe(1);
      expect(salesRepository.save).toHaveBeenCalledWith(sale);
      expect(purchasesRepository.save).toHaveBeenCalled();
    });
  });
});
