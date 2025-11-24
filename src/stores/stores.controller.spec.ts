import { Test, TestingModule } from '@nestjs/testing';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { SubscriptionValidationService } from '../subscriptions/subscription-validation.service';
import { CommentsService } from '../comments/comments.service';
import { ForbiddenException } from '@nestjs/common';

describe('StoresController', () => {
    let controller: StoresController;
    let storesService: any;
    let subscriptionValidationService: any;

    beforeEach(async () => {
        storesService = {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            getStatistics: jest.fn(),
            updateBranding: jest.fn(),
            searchStores: jest.fn(),
        };

        subscriptionValidationService = {
            canCreateStore: jest.fn(),
            getUserFeatures: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [StoresController],
            providers: [
                { provide: StoresService, useValue: storesService },
                { provide: SubscriptionValidationService, useValue: subscriptionValidationService },
                { provide: CommentsService, useValue: {} },
            ],
        }).compile();

        controller = module.get<StoresController>(StoresController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create store if subscription allows', async () => {
            const req = { user: { id: 'user-1' } };
            const dto = { name: 'Store' } as any;

            subscriptionValidationService.canCreateStore.mockResolvedValue(true);
            storesService.create.mockResolvedValue({ id: 'store-1' });

            const result = await controller.create(req as any, dto);

            expect(subscriptionValidationService.canCreateStore).toHaveBeenCalledWith('user-1');
            expect(storesService.create).toHaveBeenCalledWith('user-1', dto);
            expect(result).toEqual({ id: 'store-1' });
        });

        it('should throw ForbiddenException if subscription limit reached', async () => {
            const req = { user: { id: 'user-1' } };
            subscriptionValidationService.canCreateStore.mockResolvedValue(false);

            await expect(controller.create(req as any, {} as any))
                .rejects.toThrow(ForbiddenException);
        });
    });

    describe('getStoreStatistics', () => {
        it('should return statistics if plan allows', async () => {
            const req = { user: { id: 'user-1' } };
            subscriptionValidationService.getUserFeatures.mockResolvedValue({ statistics: true });
            storesService.getStatistics.mockResolvedValue({ totalSales: 10 });

            const result = await controller.getStoreStatistics('store-1', req as any);

            expect(result).toEqual({ totalSales: 10 });
        });

        it('should throw ForbiddenException if plan does not allow statistics', async () => {
            const req = { user: { id: 'user-1' } };
            subscriptionValidationService.getUserFeatures.mockResolvedValue({ statistics: false });

            await expect(controller.getStoreStatistics('store-1', req as any))
                .rejects.toThrow(ForbiddenException);
        });
    });

    describe('updateBranding', () => {
        it('should update branding if plan allows and user is owner', async () => {
            const req = { user: { id: 'owner-1' } };
            const store = { id: 'store-1', user: { id: 'owner-1' } };
            const files = [{ fieldname: 'logo' }] as any;

            subscriptionValidationService.getUserFeatures.mockResolvedValue({ branding: true });
            storesService.findOne.mockResolvedValue(store);
            storesService.updateBranding.mockResolvedValue({ ...store, logo_url: 'url' });

            const result = await controller.updateBranding('store-1', req as any, files);

            expect(storesService.updateBranding).toHaveBeenCalled();
            expect(result.logo_url).toBe('url');
        });

        it('should throw ForbiddenException if user is not owner', async () => {
            const req = { user: { id: 'other-user' } };
            const store = { id: 'store-1', user: { id: 'owner-1' } };

            subscriptionValidationService.getUserFeatures.mockResolvedValue({ branding: true });
            storesService.findOne.mockResolvedValue(store);

            await expect(controller.updateBranding('store-1', req as any, []))
                .rejects.toThrow(ForbiddenException);
        });
    });
});
