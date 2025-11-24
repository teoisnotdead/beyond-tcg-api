import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { UsersService } from '../users/users.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SubscriptionsService', () => {
    let service: SubscriptionsService;
    let plansRepository: any;
    let subscriptionsRepository: any;
    let usersService: any;
    let eventEmitter: any;

    beforeEach(async () => {
        plansRepository = {
            find: jest.fn(),
            findOne: jest.fn(),
        };

        subscriptionsRepository = {
            findOne: jest.fn(),
            save: jest.fn(),
        };

        usersService = {
            findOne: jest.fn(),
            update: jest.fn(),
        };

        eventEmitter = {
            emit: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubscriptionsService,
                { provide: getRepositoryToken(SubscriptionPlan), useValue: plansRepository },
                { provide: getRepositoryToken(UserSubscription), useValue: subscriptionsRepository },
                { provide: UsersService, useValue: usersService },
                { provide: EventEmitter2, useValue: eventEmitter },
            ],
        }).compile();

        service = module.get<SubscriptionsService>(SubscriptionsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getAllPlans', () => {
        it('should return all active plans', async () => {
            const plans = [{ id: 'plan-1', name: 'Basic', is_active: true }];
            plansRepository.find.mockResolvedValue(plans);

            const result = await service.getAllPlans();

            expect(plansRepository.find).toHaveBeenCalledWith({ where: { is_active: true } });
            expect(result).toEqual(plans);
        });
    });

    describe('getPlanById', () => {
        it('should return a plan by id', async () => {
            const plan = { id: 'plan-1', name: 'Basic' };
            plansRepository.findOne.mockResolvedValue(plan);

            const result = await service.getPlanById('plan-1');

            expect(plansRepository.findOne).toHaveBeenCalledWith({ where: { id: 'plan-1' } });
            expect(result).toEqual(plan);
        });

        it('should throw NotFoundException if plan not found', async () => {
            plansRepository.findOne.mockResolvedValue(null);

            await expect(service.getPlanById('invalid')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getCurrentSubscription', () => {
        it('should return current subscription', async () => {
            const user = { id: 'user-1', current_subscription_id: 'sub-1' };
            const subscription = { id: 'sub-1', plan_id: 'plan-1' };

            usersService.findOne.mockResolvedValue(user);
            subscriptionsRepository.findOne.mockResolvedValue(subscription);

            const result = await service.getCurrentSubscription('user-1');

            expect(usersService.findOne).toHaveBeenCalledWith('user-1');
            expect(subscriptionsRepository.findOne).toHaveBeenCalledWith({ where: { id: 'sub-1' } });
            expect(result).toEqual(subscription);
        });

        it('should throw NotFoundException if user has no subscription', async () => {
            const user = { id: 'user-1', current_subscription_id: null };
            usersService.findOne.mockResolvedValue(user);

            await expect(service.getCurrentSubscription('user-1')).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if subscription not found', async () => {
            const user = { id: 'user-1', current_subscription_id: 'sub-1' };
            usersService.findOne.mockResolvedValue(user);
            subscriptionsRepository.findOne.mockResolvedValue(null);

            await expect(service.getCurrentSubscription('user-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('upgradeSubscription', () => {
        it('should upgrade subscription successfully', async () => {
            const user = { id: 'user-1', current_subscription_id: null };
            const plan = { id: 'plan-1', name: 'Premium', is_active: true, duration_days: 30 };
            const newSubscription = { id: 'sub-1', user_id: 'user-1', plan_id: 'plan-1' };

            usersService.findOne.mockResolvedValue(user);
            plansRepository.findOne.mockResolvedValue(plan);
            subscriptionsRepository.save.mockResolvedValue(newSubscription);
            usersService.update.mockResolvedValue(undefined);

            const result = await service.upgradeSubscription('user-1', 'plan-1');

            expect(plansRepository.findOne).toHaveBeenCalledWith({ where: { id: 'plan-1' } });
            expect(subscriptionsRepository.save).toHaveBeenCalled();
            expect(usersService.update).toHaveBeenCalledWith('user-1', { current_subscription_id: 'sub-1' });
            expect(eventEmitter.emit).toHaveBeenCalledWith('user.subscriptionChanged', expect.any(Object));
            expect(result).toEqual(newSubscription);
        });

        it('should deactivate old subscription when upgrading', async () => {
            const oldSubscription = { id: 'sub-old', is_active: true };
            const user = { id: 'user-1', current_subscription_id: 'sub-old' };
            const plan = { id: 'plan-2', name: 'Premium', is_active: true, duration_days: 30 };
            const newSubscription = { id: 'sub-new', user_id: 'user-1', plan_id: 'plan-2' };

            usersService.findOne.mockResolvedValue(user);
            plansRepository.findOne.mockResolvedValue(plan);
            subscriptionsRepository.findOne.mockResolvedValue(oldSubscription);
            subscriptionsRepository.save.mockResolvedValue(newSubscription);

            await service.upgradeSubscription('user-1', 'plan-2');

            expect(subscriptionsRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ is_active: false })
            );
        });

        it('should throw NotFoundException if plan not found', async () => {
            const user = { id: 'user-1' };
            usersService.findOne.mockResolvedValue(user);
            plansRepository.findOne.mockResolvedValue(null);

            await expect(service.upgradeSubscription('user-1', 'invalid')).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if plan is not active', async () => {
            const user = { id: 'user-1' };
            const plan = { id: 'plan-1', is_active: false };

            usersService.findOne.mockResolvedValue(user);
            plansRepository.findOne.mockResolvedValue(plan);

            await expect(service.upgradeSubscription('user-1', 'plan-1')).rejects.toThrow(BadRequestException);
        });
    });
});
