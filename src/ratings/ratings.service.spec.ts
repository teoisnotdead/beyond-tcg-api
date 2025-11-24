import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RatingsService } from './ratings.service';
import { UserRating } from './entities/user-rating.entity';
import { StoreRating } from './entities/store-rating.entity';
import { BadRequestException } from '@nestjs/common';

describe('RatingsService', () => {
    let service: RatingsService;
    let userRatingRepository: any;
    let storeRatingRepository: any;

    beforeEach(async () => {
        const mockUserQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            getOne: jest.fn(),
            getRawOne: jest.fn(),
        };

        const mockStoreQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            getOne: jest.fn(),
            getRawOne: jest.fn(),
        };

        userRatingRepository = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => mockUserQueryBuilder),
        };

        storeRatingRepository = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => mockStoreQueryBuilder),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RatingsService,
                { provide: getRepositoryToken(UserRating), useValue: userRatingRepository },
                { provide: getRepositoryToken(StoreRating), useValue: storeRatingRepository },
            ],
        }).compile();

        service = module.get<RatingsService>(RatingsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createUserRating', () => {
        it('should create a user rating', async () => {
            const createDto = { user_id: 'user-1', sale_id: 'sale-1', rating: 5, comment: 'Great!' };
            const raterId = 'rater-1';
            const rating = { id: 'rating-1', ...createDto };

            const mockQueryBuilder = userRatingRepository.createQueryBuilder();
            mockQueryBuilder.getOne.mockResolvedValue(null); // No existing rating

            userRatingRepository.create.mockReturnValue(rating);
            userRatingRepository.save.mockResolvedValue(rating);

            const result = await service.createUserRating(createDto, raterId);

            expect(userRatingRepository.create).toHaveBeenCalledWith({
                user: { id: 'user-1' },
                rater: { id: raterId },
                sale: { id: 'sale-1' },
                rating: 5,
                comment: 'Great!',
            });
            expect(result).toEqual(rating);
        });

        it('should throw BadRequestException if user tries to rate themselves', async () => {
            const createDto = { user_id: 'user-1', sale_id: 'sale-1', rating: 5 };
            const raterId = 'user-1'; // Same as user_id

            await expect(service.createUserRating(createDto, raterId))
                .rejects.toThrow(BadRequestException);
            await expect(service.createUserRating(createDto, raterId))
                .rejects.toThrow('No puedes calificarte a ti mismo.');
        });

        it('should throw BadRequestException if rating already exists', async () => {
            const createDto = { user_id: 'user-1', sale_id: 'sale-1', rating: 5 };
            const raterId = 'rater-1';
            const existingRating = { id: 'rating-1' };

            const mockQueryBuilder = userRatingRepository.createQueryBuilder();
            mockQueryBuilder.getOne.mockResolvedValue(existingRating);

            await expect(service.createUserRating(createDto, raterId))
                .rejects.toThrow(BadRequestException);
            await expect(service.createUserRating(createDto, raterId))
                .rejects.toThrow('Ya has calificado esta venta.');
        });
    });

    describe('createStoreRating', () => {
        it('should create a store rating', async () => {
            const createDto = { store_id: 'store-1', sale_id: 'sale-1', rating: 4, comment: 'Good' };
            const raterId = 'rater-1';
            const rating = { id: 'rating-1', ...createDto };

            const mockQueryBuilder = storeRatingRepository.createQueryBuilder();
            mockQueryBuilder.getOne.mockResolvedValue(null);

            storeRatingRepository.create.mockReturnValue(rating);
            storeRatingRepository.save.mockResolvedValue(rating);

            const result = await service.createStoreRating(createDto, raterId);

            expect(storeRatingRepository.create).toHaveBeenCalled();
            expect(result).toEqual(rating);
        });

        it('should throw BadRequestException if store rating already exists', async () => {
            const createDto = { store_id: 'store-1', sale_id: 'sale-1', rating: 4 };
            const raterId = 'rater-1';
            const existingRating = { id: 'rating-1' };

            const mockQueryBuilder = storeRatingRepository.createQueryBuilder();
            mockQueryBuilder.getOne.mockResolvedValue(existingRating);

            await expect(service.createStoreRating(createDto, raterId))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('getUserRatings', () => {
        it('should return user ratings', async () => {
            const userId = 'user-1';
            const ratings = [
                { id: 'rating-1', rating: 5 },
                { id: 'rating-2', rating: 4 },
            ];

            userRatingRepository.find.mockResolvedValue(ratings);

            const result = await service.getUserRatings(userId);

            expect(userRatingRepository.find).toHaveBeenCalledWith({
                where: { user: { id: userId } },
            });
            expect(result).toEqual(ratings);
        });
    });

    describe('getStoreRatings', () => {
        it('should return store ratings', async () => {
            const storeId = 'store-1';
            const ratings = [
                { id: 'rating-1', rating: 5 },
                { id: 'rating-2', rating: 3 },
            ];

            storeRatingRepository.find.mockResolvedValue(ratings);

            const result = await service.getStoreRatings(storeId);

            expect(storeRatingRepository.find).toHaveBeenCalledWith({
                where: { store: { id: storeId } },
            });
            expect(result).toEqual(ratings);
        });
    });

    describe('getUserAverageRating', () => {
        it('should calculate average user rating', async () => {
            const userId = 'user-1';
            const mockQueryBuilder = userRatingRepository.createQueryBuilder();
            mockQueryBuilder.getRawOne.mockResolvedValue({ avg: '4.5' });

            const result = await service.getUserAverageRating(userId);

            expect(mockQueryBuilder.select).toHaveBeenCalledWith('AVG(rating.rating)', 'avg');
            expect(result).toBe(4.5);
        });

        it('should return 0 if no ratings exist', async () => {
            const userId = 'user-1';
            const mockQueryBuilder = userRatingRepository.createQueryBuilder();
            mockQueryBuilder.getRawOne.mockResolvedValue({ avg: null });

            const result = await service.getUserAverageRating(userId);

            expect(result).toBe(0);
        });
    });

    describe('getStoreAverageRating', () => {
        it('should calculate average store rating', async () => {
            const storeId = 'store-1';
            const mockQueryBuilder = storeRatingRepository.createQueryBuilder();
            mockQueryBuilder.getRawOne.mockResolvedValue({ avg: '3.8' });

            const result = await service.getStoreAverageRating(storeId);

            expect(result).toBe(3.8);
        });

        it('should return 0 if no ratings exist', async () => {
            const storeId = 'store-1';
            const mockQueryBuilder = storeRatingRepository.createQueryBuilder();
            mockQueryBuilder.getRawOne.mockResolvedValue({ avg: null });

            const result = await service.getStoreAverageRating(storeId);

            expect(result).toBe(0);
        });
    });
});
