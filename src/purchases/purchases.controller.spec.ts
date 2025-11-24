import { Test, TestingModule } from '@nestjs/testing';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';

describe('PurchasesController', () => {
    let controller: PurchasesController;
    let service: any;

    beforeEach(async () => {
        service = {
            create: jest.fn(),
            findAllByUser: jest.fn(),
            findAllBySeller: jest.fn(),
            findOneDetailed: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [PurchasesController],
            providers: [
                { provide: PurchasesService, useValue: service },
            ],
        }).compile();

        controller = module.get<PurchasesController>(PurchasesController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a purchase', async () => {
            const req = { user: { id: 'user-1' } };
            const dto = { sale_id: 'sale-1', quantity: 1 };
            const purchase = { id: 'purchase-1', ...dto };

            service.create.mockResolvedValue(purchase);

            const result = await controller.create(req as any, dto as any);

            expect(service.create).toHaveBeenCalledWith('user-1', dto);
            expect(result).toEqual(purchase);
        });
    });

    describe('findMyPurchases', () => {
        it('should return user purchases', async () => {
            const req = { user: { id: 'user-1' } };
            const filters = { page: 1, limit: 10 };
            const purchases = { data: [{ id: 'purchase-1' }], meta: { total: 1 } };

            service.findAllByUser.mockResolvedValue(purchases);

            const result = await controller.findMyPurchases(req as any, filters as any);

            expect(service.findAllByUser).toHaveBeenCalledWith('user-1', filters);
            expect(result).toEqual(purchases);
        });
    });

    describe('findMySalesAsPurchases', () => {
        it('should return sales as purchases', async () => {
            const req = { user: { id: 'seller-1' } };
            const filters = { page: 1, limit: 10 };
            const sales = { data: [{ id: 'purchase-1' }], meta: { total: 1 } };

            service.findAllBySeller.mockResolvedValue(sales);

            const result = await controller.findMySalesAsPurchases(req as any, filters as any);

            expect(service.findAllBySeller).toHaveBeenCalledWith('seller-1', filters);
            expect(result).toEqual(sales);
        });
    });

    describe('findOneDetailed', () => {
        it('should return purchase details', async () => {
            const req = { user: { id: 'user-1' } };
            const purchase = { id: 'purchase-1', sale_id: 'sale-1', buyer_id: 'user-1' };

            service.findOneDetailed.mockResolvedValue(purchase);

            const result = await controller.findOneDetailed('purchase-1', req as any);

            expect(service.findOneDetailed).toHaveBeenCalledWith('purchase-1', 'user-1');
            expect(result).toEqual(purchase);
        });
    });
});
