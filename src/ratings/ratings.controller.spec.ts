import { Test, TestingModule } from '@nestjs/testing';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';

describe('RatingsController', () => {
    let controller: RatingsController;
    let service: any;

    beforeEach(async () => {
        service = {
            createUserRating: jest.fn(),
            createStoreRating: jest.fn(),
            getUserRatings: jest.fn(),
            getStoreRatings: jest.fn(),
            getUserAverageRating: jest.fn(),
            getStoreAverageRating: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [RatingsController],
            providers: [
                { provide: RatingsService, useValue: service },
            ],
        }).compile();

        controller = module.get<RatingsController>(RatingsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createUserRating', () => {
        it('should create a user rating', async () => {
            const req = { user: { id: 'rater-1' } };
            const dto = { rated_user_id: 'user-1', sale_id: 'sale-1', rating: 5, comment: 'Great!' };
            const rating = { id: 'rating-1', ...dto };

            service.createUserRating.mockResolvedValue(rating);

            const result = await controller.createUserRating(dto as any, req as any);

            expect(service.createUserRating).toHaveBeenCalledWith(dto, 'rater-1');
            expect(result).toEqual(rating);
        });
    });

    describe('createStoreRating', () => {
        it('should create a store rating', async () => {
            const req = { user: { id: 'rater-1' } };
            const dto = { store_id: 'store-1', sale_id: 'sale-1', rating: 4, comment: 'Good!' };
            const rating = { id: 'rating-1', ...dto };

            service.createStoreRating.mockResolvedValue(rating);

            const result = await controller.createStoreRating(dto as any, req as any);

            expect(service.createStoreRating).toHaveBeenCalledWith(dto, 'rater-1');
            expect(result).toEqual(rating);
        });
    });

    describe('getUserRatings', () => {
        it('should return user ratings', async () => {
            const ratings = [{ id: 'rating-1', rating: 5 }];
            service.getUserRatings.mockResolvedValue(ratings);

            const result = await controller.getUserRatings('user-1');

            expect(service.getUserRatings).toHaveBeenCalledWith('user-1');
            expect(result).toEqual(ratings);
        });
    });

    describe('getStoreRatings', () => {
        it('should return store ratings', async () => {
            const ratings = [{ id: 'rating-1', rating: 4 }];
            service.getStoreRatings.mockResolvedValue(ratings);

            const result = await controller.getStoreRatings('store-1');

            expect(service.getStoreRatings).toHaveBeenCalledWith('store-1');
            expect(result).toEqual(ratings);
        });
    });

    describe('getUserAverageRating', () => {
        it('should return user average rating', async () => {
            service.getUserAverageRating.mockResolvedValue(4.5);

            const result = await controller.getUserAverageRating('user-1');

            expect(service.getUserAverageRating).toHaveBeenCalledWith('user-1');
            expect(result).toEqual({ userId: 'user-1', average: 4.5 });
        });
    });

    describe('getStoreAverageRating', () => {
        it('should return store average rating', async () => {
            service.getStoreAverageRating.mockResolvedValue(4.8);

            const result = await controller.getStoreAverageRating('store-1');

            expect(service.getStoreAverageRating).toHaveBeenCalledWith('store-1');
            expect(result).toEqual({ storeId: 'store-1', average: 4.8 });
        });
    });
});
