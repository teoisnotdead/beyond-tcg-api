import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FavoritesService } from './favorites.service';
import { Favorite } from './entities/favorite.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

describe('FavoritesService', () => {
    let service: FavoritesService;
    let repository: any;
    let notificationsService: any;

    beforeEach(async () => {
        const mockQueryBuilder = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn(),
        };

        repository = {
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
        };

        notificationsService = {
            create: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FavoritesService,
                { provide: getRepositoryToken(Favorite), useValue: repository },
                { provide: NotificationsService, useValue: notificationsService },
            ],
        }).compile();

        service = module.get<FavoritesService>(FavoritesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a favorite and notify seller', async () => {
            const userId = 'user-1';
            const createDto = { sale_id: 'sale-1' };
            const favorite = { id: 'fav-1', user: { id: userId }, sale: { id: 'sale-1' } };
            const saleWithSeller = {
                id: 'fav-1',
                sale: {
                    id: 'sale-1',
                    seller: { id: 'seller-1' },
                },
            };

            repository.create.mockReturnValue(favorite);
            repository.save.mockResolvedValue(favorite);

            const mockQueryBuilder = repository.createQueryBuilder();
            mockQueryBuilder.getOne.mockResolvedValue(saleWithSeller);

            const result = await service.create(userId, createDto);

            expect(repository.create).toHaveBeenCalledWith({
                user: { id: userId },
                sale: { id: 'sale-1' },
            });
            expect(repository.save).toHaveBeenCalledWith(favorite);
            expect(notificationsService.create).toHaveBeenCalledWith({
                user_id: 'seller-1',
                type: NotificationType.FAVORITE_ADDED,
                metadata: {
                    favorite_id: 'fav-1',
                    sale_id: 'sale-1',
                    user_id: userId,
                },
            });
            expect(result).toEqual(favorite);
        });

        it('should create favorite without notification if seller not found', async () => {
            const userId = 'user-1';
            const createDto = { sale_id: 'sale-1' };
            const favorite = { id: 'fav-1', user: { id: userId }, sale: { id: 'sale-1' } };

            repository.create.mockReturnValue(favorite);
            repository.save.mockResolvedValue(favorite);

            const mockQueryBuilder = repository.createQueryBuilder();
            mockQueryBuilder.getOne.mockResolvedValue(null);

            const result = await service.create(userId, createDto);

            expect(notificationsService.create).not.toHaveBeenCalled();
            expect(result).toEqual(favorite);
        });
    });

    describe('removeFavorite', () => {
        it('should remove a favorite', async () => {
            const userId = 'user-1';
            const saleId = 'sale-1';

            repository.delete.mockResolvedValue({ affected: 1 });

            await service.removeFavorite(userId, saleId);

            expect(repository.delete).toHaveBeenCalledWith({
                user: { id: userId },
                sale: { id: saleId },
            });
        });
    });

    describe('getUserFavorites', () => {
        it('should return user favorites with sale relations', async () => {
            const userId = 'user-1';
            const favorites = [
                { id: 'fav-1', user: { id: userId }, sale: { id: 'sale-1', name: 'Card 1' } },
                { id: 'fav-2', user: { id: userId }, sale: { id: 'sale-2', name: 'Card 2' } },
            ];

            repository.find.mockResolvedValue(favorites);

            const result = await service.getUserFavorites(userId);

            expect(repository.find).toHaveBeenCalledWith({
                where: { user: { id: userId } },
                relations: ['sale'],
            });
            expect(result).toEqual(favorites);
        });

        it('should return empty array when user has no favorites', async () => {
            const userId = 'user-1';

            repository.find.mockResolvedValue([]);

            const result = await service.getUserFavorites(userId);

            expect(result).toEqual([]);
        });
    });
});
