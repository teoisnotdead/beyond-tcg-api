import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsController', () => {
    let controller: SubscriptionsController;
    let service: any;

    beforeEach(async () => {
        service = {
            getAllPlans: jest.fn(),
            getPlanById: jest.fn(),
            getCurrentSubscription: jest.fn(),
            upgradeSubscription: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [SubscriptionsController],
            providers: [
                { provide: SubscriptionsService, useValue: service },
            ],
        }).compile();

        controller = module.get<SubscriptionsController>(SubscriptionsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getAllPlans', () => {
        it('should return all subscription plans', async () => {
            const plans = [
                { id: 'plan-1', name: 'Basic', price: 0 },
                { id: 'plan-2', name: 'Premium', price: 9.99 },
            ];
            service.getAllPlans.mockResolvedValue(plans);

            const result = await controller.getAllPlans();

            expect(service.getAllPlans).toHaveBeenCalled();
            expect(result).toEqual(plans);
        });
    });

    describe('getPlanById', () => {
        it('should return a plan by id', async () => {
            const plan = { id: 'plan-1', name: 'Basic', price: 0 };
            service.getPlanById.mockResolvedValue(plan);

            const result = await controller.getPlanById('plan-1');

            expect(service.getPlanById).toHaveBeenCalledWith('plan-1');
            expect(result).toEqual(plan);
        });
    });

    describe('getCurrentSubscription', () => {
        it('should return current user subscription', async () => {
            const req = { user: { id: 'user-1' } };
            const subscription = { id: 'sub-1', plan_id: 'plan-1', user_id: 'user-1' };
            service.getCurrentSubscription.mockResolvedValue(subscription);

            const result = await controller.getCurrentSubscription(req as any);

            expect(service.getCurrentSubscription).toHaveBeenCalledWith('user-1');
            expect(result).toEqual(subscription);
        });
    });

    describe('upgradeSubscription', () => {
        it('should upgrade user subscription', async () => {
            const req = { user: { id: 'user-1' } };
            const upgraded = { id: 'sub-1', plan_id: 'plan-2', user_id: 'user-1' };
            service.upgradeSubscription.mockResolvedValue(upgraded);

            const result = await controller.upgradeSubscription(req, 'plan-2');

            expect(service.upgradeSubscription).toHaveBeenCalledWith('user-1', 'plan-2');
            expect(result).toEqual(upgraded);
        });
    });
});
