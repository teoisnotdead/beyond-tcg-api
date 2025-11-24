import { Test, TestingModule } from '@nestjs/testing';
import { FeaturedService } from './featured.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Store } from '../stores/entities/store.entity';
import { User } from '../users/entities/user.entity';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';

describe('FeaturedService', () => {
    let service: FeaturedService;
    let storesRepository: any;
    let usersRepository: any;
    let plansRepository: any;
    let userSubscriptionsRepository: any;
    let salesRepository: any;

    beforeEach(async () => {
        // Mock query builder
        const createQueryBuilder = (returnValue: any) => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue(returnValue),
        });

        storesRepository = {
            createQueryBuilder: jest.fn(),
        };

        usersRepository = {
            createQueryBuilder: jest.fn(),
        };

        plansRepository = {
            findOne: jest.fn(),
        };

        userSubscriptionsRepository = {
            createQueryBuilder: jest.fn(),
        };

        salesRepository = {
            find: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FeaturedService,
                { provide: getRepositoryToken(Store), useValue: storesRepository },
                { provide: getRepositoryToken(User), useValue: usersRepository },
                { provide: getRepositoryToken(SubscriptionPlan), useValue: plansRepository },
                { provide: getRepositoryToken(UserSubscription), useValue: userSubscriptionsRepository },
                { provide: getRepositoryToken(Sale), useValue: salesRepository },
            ],
        }).compile();

        service = module.get<FeaturedService>(FeaturedService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getFeatured', () => {
        it('should return featured stores and users', async () => {
            const storePlan = { id: 'plan-store', name: 'Store' };
            const proPlan = { id: 'plan-pro', name: 'Pro' };

            const storeSubs = [{ user_id: 'user-1' }];
            const proSubs = [{ user_id: 'user-2' }];

            const stores = [
                {
                    id: 'store-1',
                    name: 'Test Store',
                    avatar_url: 'avatar.jpg',
                    banner_url: 'banner.jpg',
                    description: 'Test',
                    user: { id: 'user-1' },
                },
            ];

            const proUsers = [
                {
                    id: 'user-2',
                    name: 'Pro User',
                    avatar_url: 'avatar2.jpg',
                    is_store: false,
                },
            ];

            const storeSales = [
                { views: 10, status: SaleStatus.AVAILABLE },
                { views: 5, status: SaleStatus.COMPLETED },
            ];

            const userSales = [
                { views: 20, status: SaleStatus.AVAILABLE },
                { views: 15, status: SaleStatus.AVAILABLE },
            ];

            // Setup mocks
            plansRepository.findOne
                .mockResolvedValueOnce(storePlan)
                .mockResolvedValueOnce(proPlan);

            userSubscriptionsRepository.createQueryBuilder
                .mockReturnValueOnce({
                    where: jest.fn().mockReturnThis(),
                    andWhere: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue(storeSubs),
                })
                .mockReturnValueOnce({
                    where: jest.fn().mockReturnThis(),
                    andWhere: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue(proSubs),
                });

            storesRepository.createQueryBuilder.mockReturnValue({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(stores),
            });

            usersRepository.createQueryBuilder.mockReturnValue({
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(proUsers),
            });

            salesRepository.find
                .mockResolvedValueOnce(storeSales)
                .mockResolvedValueOnce(userSales);

            const result = await service.getFeatured();

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: 'store-1',
                name: 'Test Store',
                avatar_url: 'avatar.jpg',
                banner_url: 'banner.jpg',
                description: 'Test',
                totalViews: 15,
                activeSales: 1,
                type: 'store',
            });
            expect(result[1]).toEqual({
                id: 'user-2',
                name: 'Pro User',
                avatar_url: 'avatar2.jpg',
                totalViews: 35,
                activeSales: 2,
                type: 'user',
            });
        });

        it('should throw error if Store plan not found', async () => {
            plansRepository.findOne.mockResolvedValue(null);

            await expect(service.getFeatured()).rejects.toThrow('Store plan not found');
        });

        it('should throw error if Pro plan not found', async () => {
            const storePlan = { id: 'plan-store', name: 'Store' };
            plansRepository.findOne
                .mockResolvedValueOnce(storePlan)
                .mockResolvedValueOnce(null);

            await expect(service.getFeatured()).rejects.toThrow('Pro plan not found');
        });

        it('should handle empty subscriptions', async () => {
            const storePlan = { id: 'plan-store', name: 'Store' };
            const proPlan = { id: 'plan-pro', name: 'Pro' };

            plansRepository.findOne
                .mockResolvedValueOnce(storePlan)
                .mockResolvedValueOnce(proPlan);

            userSubscriptionsRepository.createQueryBuilder
                .mockReturnValueOnce({
                    where: jest.fn().mockReturnThis(),
                    andWhere: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([]),
                })
                .mockReturnValueOnce({
                    where: jest.fn().mockReturnThis(),
                    andWhere: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([]),
                });

            storesRepository.createQueryBuilder.mockReturnValue({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            });

            usersRepository.createQueryBuilder.mockReturnValue({
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            });

            const result = await service.getFeatured();

            expect(result).toEqual([]);
        });

        it('should calculate metrics correctly with no sales', async () => {
            const storePlan = { id: 'plan-store', name: 'Store' };
            const proPlan = { id: 'plan-pro', name: 'Pro' };

            const storeSubs = [{ user_id: 'user-1' }];
            const stores = [
                {
                    id: 'store-1',
                    name: 'Test Store',
                    avatar_url: 'avatar.jpg',
                    banner_url: 'banner.jpg',
                    description: 'Test',
                    user: { id: 'user-1' },
                },
            ];

            plansRepository.findOne
                .mockResolvedValueOnce(storePlan)
                .mockResolvedValueOnce(proPlan);

            userSubscriptionsRepository.createQueryBuilder
                .mockReturnValueOnce({
                    where: jest.fn().mockReturnThis(),
                    andWhere: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue(storeSubs),
                })
                .mockReturnValueOnce({
                    where: jest.fn().mockReturnThis(),
                    andWhere: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([]),
                });

            storesRepository.createQueryBuilder.mockReturnValue({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(stores),
            });

            usersRepository.createQueryBuilder.mockReturnValue({
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            });

            salesRepository.find.mockResolvedValue([]);

            const result = await service.getFeatured();

            expect(result).toHaveLength(1);
            expect(result[0].totalViews).toBe(0);
            expect(result[0].activeSales).toBe(0);
        });
    });
});
