import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesService } from './sales.service';
import { Sale, SaleStatus } from './entities/sale.entity';
import { PurchasesService } from '../purchases/purchases.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

describe('SalesService.confirmDelivery', () => {
  let salesService: SalesService;
  let salesRepository: jest.Mocked<Repository<Sale>>;
  let purchasesService: { create: jest.Mock };

  beforeEach(async () => {
    salesRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    } as any;

    purchasesService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PurchasesService, useValue: purchasesService },
        { provide: CloudinaryService, useValue: {} },
        { provide: getRepositoryToken(Sale), useValue: salesRepository },
      ],
    }).compile();

    salesService = module.get<SalesService>(SalesService);
  });

  it('should use the reserved quantity when registering the purchase and restock the remaining inventory', async () => {
    const saleId = 'sale-1';
    const saleBefore = {
      id: saleId,
      seller: { id: 'seller-1' },
      buyer: { id: 'buyer-1' },
      buyer_id: 'buyer-1',
      status: SaleStatus.SHIPPED,
      quantity: 10,
      reserved_quantity: 4,
    } as Sale;

    const saleAfterPurchase = { ...saleBefore, quantity: 6 } as Sale;

    salesRepository.findOne.mockResolvedValueOnce(saleBefore);
    salesRepository.findOne.mockResolvedValueOnce(saleAfterPurchase);
    salesRepository.save.mockImplementation(async (sale) => sale as Sale);
    purchasesService.create.mockResolvedValue({});

    await salesService.confirmDelivery(saleId, 'buyer-1', 'proof-url');

    expect(purchasesService.create).toHaveBeenCalledWith('buyer-1', {
      sale_id: saleId,
      quantity: 4,
    });

    expect(salesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: saleId,
        quantity: 6,
        status: SaleStatus.AVAILABLE,
        reserved_quantity: undefined,
        buyer_id: undefined,
      }),
    );
  });

  it('should mark the sale as completed when all stock is delivered', async () => {
    const saleId = 'sale-2';
    const saleBefore = {
      id: saleId,
      seller: { id: 'seller-2' },
      buyer: { id: 'buyer-2' },
      buyer_id: 'buyer-2',
      status: SaleStatus.SHIPPED,
      quantity: 3,
      reserved_quantity: 3,
    } as Sale;

    const saleAfterPurchase = { ...saleBefore, quantity: 0 } as Sale;

    salesRepository.findOne.mockResolvedValueOnce(saleBefore);
    salesRepository.findOne.mockResolvedValueOnce(saleAfterPurchase);
    salesRepository.save.mockImplementation(async (sale) => sale as Sale);
    purchasesService.create.mockResolvedValue({});

    await salesService.confirmDelivery(saleId, 'buyer-2', 'proof-url');

    expect(purchasesService.create).toHaveBeenCalledWith('buyer-2', {
      sale_id: saleId,
      quantity: 3,
    });

    expect(salesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: saleId,
        quantity: 0,
        status: SaleStatus.COMPLETED,
        reserved_quantity: 3,
        completed_at: expect.any(Date),
      }),
    );
  });
});
