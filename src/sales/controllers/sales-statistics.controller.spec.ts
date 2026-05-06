import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SalesStatisticsController } from './sales-statistics.controller';
import { SalesStatisticsService } from '../services/sales-statistics.service';
import { UserSubscription } from '../../subscriptions/entities/user-subscription.entity';
import { SubscriptionPlan } from '../../subscriptions/entities/subscription-plan.entity';

describe('SalesStatisticsController', () => {
  let controller: SalesStatisticsController;
  let statisticsService: { getUserStatistics: jest.Mock };
  let userSubscriptionRepository: { findOne: jest.Mock };
  let subscriptionPlanRepository: { findOne: jest.Mock };

  const mockStats = {
    total_sales: 1,
    total_purchases: 1,
    total_revenue: 10,
    total_spent: 10,
    average_rating: 5,
    sales_metrics: {
      active_listings: 1,
      completed_sales: 1,
      cancelled_sales: 0,
      average_sale_price: 10,
      average_time_to_sell: 1,
      conversion_rate: 100,
    },
    purchase_metrics: {
      total_orders: 1,
      average_order_value: 10,
      favorite_categories: [],
    },
    activity_metrics: {
      last_activity: new Date(),
      average_response_time: 1,
      completion_rate: 100,
      cancellation_rate: 0,
    },
    recent_trends: {
      daily_sales: [],
      daily_purchases: [],
    },
  };

  beforeEach(async () => {
    statisticsService = {
      getUserStatistics: jest.fn(),
    };

    userSubscriptionRepository = {
      findOne: jest.fn(),
    };

    subscriptionPlanRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesStatisticsController],
      providers: [
        { provide: SalesStatisticsService, useValue: statisticsService },
        { provide: getRepositoryToken(UserSubscription), useValue: userSubscriptionRepository },
        { provide: getRepositoryToken(SubscriptionPlan), useValue: subscriptionPlanRepository },
      ],
    }).compile();

    controller = module.get<SalesStatisticsController>(SalesStatisticsController);
  });

  describe('getUserStatistics', () => {
    it('returns statistics when active plan has features.statistics=true', async () => {
      userSubscriptionRepository.findOne.mockResolvedValue({
        plan_id: 'plan-pro',
        is_active: true,
      });
      subscriptionPlanRepository.findOne.mockResolvedValue({
        id: 'plan-pro',
        features: { statistics: true },
      });
      statisticsService.getUserStatistics.mockResolvedValue(mockStats);

      const req = { user: { id: 'user-1' } };
      const result = await controller.getUserStatistics(req as any);

      expect(result).toEqual(mockStats);
      expect(statisticsService.getUserStatistics).toHaveBeenCalledWith('user-1');
    });

    it('throws ForbiddenException when plan does not include statistics', async () => {
      userSubscriptionRepository.findOne.mockResolvedValue({
        plan_id: 'plan-free',
        is_active: true,
      });
      subscriptionPlanRepository.findOne.mockResolvedValue({
        id: 'plan-free',
        features: { statistics: false },
      });

      const req = { user: { id: 'user-1' } };
      await expect(controller.getUserStatistics(req as any)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getStoreStatistics', () => {
    it('throws ForbiddenException when user is not store account', async () => {
      const req = { user: { id: 'user-1', is_store: false } };
      await expect(controller.getStoreStatistics(req as any)).rejects.toThrow(ForbiddenException);
    });

    it('returns statistics when store account has statistics feature', async () => {
      userSubscriptionRepository.findOne.mockResolvedValue({
        plan_id: 'plan-store',
        is_active: true,
      });
      subscriptionPlanRepository.findOne.mockResolvedValue({
        id: 'plan-store',
        features: { statistics: true },
      });
      statisticsService.getUserStatistics.mockResolvedValue(mockStats);

      const req = { user: { id: 'user-2', is_store: true } };
      const result = await controller.getStoreStatistics(req as any);

      expect(result).toEqual(mockStats);
      expect(statisticsService.getUserStatistics).toHaveBeenCalledWith('user-2');
    });
  });
});
