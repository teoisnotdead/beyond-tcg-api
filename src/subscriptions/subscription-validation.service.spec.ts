import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionValidationService } from './subscription-validation.service';
import { SubscriptionsService } from './subscriptions.service';
import { SalesService } from '../sales/sales.service';

describe('SubscriptionValidationService', () => {
    let service: SubscriptionValidationService;
    let subscriptionsService: any;
    let salesService: any;

    beforeEach(async () => {
        subscriptionsService = {
            getCurrentSubscription: jest.fn(),
            getPlanById: jest.fn(),
        };

        salesService = {
            countActiveSalesByUser: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubscriptionValidationService,
                { provide: SubscriptionsService, useValue: subscriptionsService },
                { provide: SalesService, useValue: salesService },
            ],
        }).compile();

        service = module.get<SubscriptionValidationService>(SubscriptionValidationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getUserFeatures', () => {
        it('should return user plan features', async () => {
            const userId = 'user-1';
            const subscription = { plan_id: 'plan-1' };
            const plan = {
                id: 'plan-1',
                features: { maxSales: 10, canCreateStore: true }
            };

            subscriptionsService.getCurrentSubscription.mockResolvedValue(subscription);
            subscriptionsService.getPlanById.mockResolvedValue(plan);

            const features = await service.getUserFeatures(userId);

            expect(features).toEqual({ maxSales: 10, canCreateStore: true });
            expect(subscriptionsService.getCurrentSubscription).toHaveBeenCalledWith(userId);
            expect(subscriptionsService.getPlanById).toHaveBeenCalledWith('plan-1');
        });
    });

    describe('canCreateSale', () => {
        it('should return true if user has not reached max sales limit', async () => {
            const userId = 'user-1';
            const subscription = { plan_id: 'plan-free' };
            const plan = { features: { maxSales: 5 } };

            subscriptionsService.getCurrentSubscription.mockResolvedValue(subscription);
            subscriptionsService.getPlanById.mockResolvedValue(plan);
            salesService.countActiveSalesByUser.mockResolvedValue(3);

            const canCreate = await service.canCreateSale(userId);

            expect(canCreate).toBe(true);
            expect(salesService.countActiveSalesByUser).toHaveBeenCalledWith(userId);
        });

        it('should return false if user has reached max sales limit', async () => {
            const userId = 'user-1';
            const subscription = { plan_id: 'plan-free' };
            const plan = { features: { maxSales: 5 } };

            subscriptionsService.getCurrentSubscription.mockResolvedValue(subscription);
            subscriptionsService.getPlanById.mockResolvedValue(plan);
            salesService.countActiveSalesByUser.mockResolvedValue(5);

            const canCreate = await service.canCreateSale(userId);

            expect(canCreate).toBe(false);
        });

        it('should return false if user has exceeded max sales limit', async () => {
            const userId = 'user-1';
            const subscription = { plan_id: 'plan-free' };
            const plan = { features: { maxSales: 5 } };

            subscriptionsService.getCurrentSubscription.mockResolvedValue(subscription);
            subscriptionsService.getPlanById.mockResolvedValue(plan);
            salesService.countActiveSalesByUser.mockResolvedValue(7);

            const canCreate = await service.canCreateSale(userId);

            expect(canCreate).toBe(false);
        });
    });

    describe('canCreateStore', () => {
        it('should return true if user plan allows store creation', async () => {
            const userId = 'user-1';
            const subscription = { plan_id: 'plan-premium' };
            const plan = { features: { canCreateStore: true } };

            subscriptionsService.getCurrentSubscription.mockResolvedValue(subscription);
            subscriptionsService.getPlanById.mockResolvedValue(plan);

            const canCreate = await service.canCreateStore(userId);

            expect(canCreate).toBe(true);
        });

        it('should return false if user plan does not allow store creation', async () => {
            const userId = 'user-1';
            const subscription = { plan_id: 'plan-free' };
            const plan = { features: { canCreateStore: false } };

            subscriptionsService.getCurrentSubscription.mockResolvedValue(subscription);
            subscriptionsService.getPlanById.mockResolvedValue(plan);

            const canCreate = await service.canCreateStore(userId);

            expect(canCreate).toBe(false);
        });
    });
});
