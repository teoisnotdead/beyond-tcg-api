import { Test, TestingModule } from '@nestjs/testing';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { SubscriptionValidationService } from '../subscriptions/subscription-validation.service';
import { CommentsService } from '../comments/comments.service';
import { SalesStateService } from './services/sales-state.service';
import { SalesHistoryService } from './services/sales-history.service';
import { SalesTransitionRulesService } from './services/sales-transition-rules.service';
import { SalesMetricsService } from './services/sales-metrics.service';
import { SalesReportService } from './services/sales-report.service';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { SaleStatus } from './entities/sale.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('SalesController', () => {
    let controller: SalesController;
    let salesService: any;
    let subscriptionValidationService: any;
    let salesStateService: any;
    let salesTransitionRulesService: any;

    beforeEach(async () => {
        salesService = {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            update: jest.fn(),
            relistSale: jest.fn(),
            searchSales: jest.fn(),
        };

        subscriptionValidationService = {
            canCreateSale: jest.fn(),
        };

        salesStateService = {
            reserveSale: jest.fn(),
            shipSale: jest.fn(),
            confirmDelivery: jest.fn(),
            completeSale: jest.fn(),
            cancelSale: jest.fn(),
        };

        salesTransitionRulesService = {
            getValidTransitions: jest.fn(),
            getTransitionRule: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [SalesController],
            providers: [
                { provide: SalesService, useValue: salesService },
                { provide: SubscriptionValidationService, useValue: subscriptionValidationService },
                { provide: CommentsService, useValue: {} },
                { provide: SalesStateService, useValue: salesStateService },
                { provide: SalesHistoryService, useValue: {} },
                { provide: SalesTransitionRulesService, useValue: salesTransitionRulesService },
                { provide: SalesMetricsService, useValue: {} },
                { provide: SalesReportService, useValue: {} },
            ],
        }).compile();

        controller = module.get<SalesController>(SalesController);
    });

    describe('create', () => {
        it('should create a sale if subscription allows', async () => {
            const req = { user: { id: 'user-1' } };
            const dto = { name: 'Item' } as any;
            const file = {} as any;

            subscriptionValidationService.canCreateSale.mockResolvedValue(true);
            salesService.create.mockResolvedValue({ id: 'sale-1' });

            const result = await controller.create(req as any, dto, file);

            expect(subscriptionValidationService.canCreateSale).toHaveBeenCalledWith('user-1');
            expect(salesService.create).toHaveBeenCalledWith('user-1', dto, file);
            expect(result).toEqual({ id: 'sale-1' });
        });

        it('should throw ForbiddenException if subscription limit reached', async () => {
            const req = { user: { id: 'user-1' } };
            subscriptionValidationService.canCreateSale.mockResolvedValue(false);

            await expect(controller.create(req as any, {} as any, {} as any))
                .rejects.toThrow(ForbiddenException);
        });

        it('should throw BadRequestException if image is missing', async () => {
            await expect(controller.create({ user: { id: '1' } } as any, {} as any, null as any))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('updateSaleStatus', () => {
        it('should update status if transition is valid', async () => {
            const saleId = 'sale-1';
            const status = SaleStatus.RESERVED;
            const req = { user: { id: 'seller-1' } };
            const sale = { id: saleId, status: SaleStatus.AVAILABLE, seller: { id: 'seller-1' } };

            salesService.findOne.mockResolvedValue(sale);
            salesTransitionRulesService.getValidTransitions.mockReturnValue([SaleStatus.RESERVED]);
            salesStateService.reserveSale.mockResolvedValue({ ...sale, status });

            const result = await controller.updateSaleStatus(
                saleId,
                status,
                { buyerId: 'buyer-1' },
                req as any
            );

            expect(salesStateService.reserveSale).toHaveBeenCalled();
            expect(result.status).toBe(SaleStatus.RESERVED);
        });

        it('should throw BadRequestException if transition is invalid', async () => {
            const saleId = 'sale-1';
            const status = SaleStatus.COMPLETED;
            const req = { user: { id: 'seller-1' } };
            const sale = { id: saleId, status: SaleStatus.AVAILABLE, seller: { id: 'seller-1' } };

            salesService.findOne.mockResolvedValue(sale);
            salesTransitionRulesService.getValidTransitions.mockReturnValue([SaleStatus.RESERVED]);
            salesTransitionRulesService.getTransitionRule.mockReturnValue(null);

            await expect(controller.updateSaleStatus(saleId, status, {}, req as any))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException if sale not found', async () => {
            salesService.findOne.mockResolvedValue(null);
            await expect(controller.updateSaleStatus('id', SaleStatus.RESERVED, {}, { user: { id: '1' } } as any))
                .rejects.toThrow(NotFoundException);
        });
    });
});
