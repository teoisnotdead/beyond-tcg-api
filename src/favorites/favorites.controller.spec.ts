import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

describe('FavoritesController', () => {
    let controller: FavoritesController;
    let service: any;

    beforeEach(async () => {
        service = {
            create: jest.fn(),
            removeFavorite: jest.fn(),
            getUserFavorites: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [FavoritesController],
            providers: [
                { provide: FavoritesService, useValue: service },
            ],
        }).compile();

        controller = module.get<FavoritesController>(FavoritesController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should add a sale to favorites', async () => {
            const req = { user: { id: 'user-1' } };
            const dto = { sale_id: 'sale-1' };
            const favorite = { id: 'fav-1', user_id: 'user-1', sale_id: 'sale-1' };

            service.create.mockResolvedValue(favorite);

            const result = await controller.create(req as any, dto as any);

            expect(service.create).toHaveBeenCalledWith('user-1', dto);
            expect(result).toEqual(favorite);
        });
    });

    describe('removeFavorite', () => {
        it('should remove a sale from favorites', async () => {
            const req = { user: { id: 'user-1' } };
            service.removeFavorite.mockResolvedValue(undefined);

            await controller.removeFavorite(req as any, 'sale-1');

            expect(service.removeFavorite).toHaveBeenCalledWith('user-1', 'sale-1');
        });
    });

    describe('getUserFavorites', () => {
        it('should return user favorites', async () => {
            const req = { user: { id: 'user-1' } };
            const favorites = [{ id: 'fav-1', sale_id: 'sale-1' }];

            service.getUserFavorites.mockResolvedValue(favorites);

            const result = await controller.getUserFavorites(req as any);

            expect(service.getUserFavorites).toHaveBeenCalledWith('user-1');
            expect(result).toEqual(favorites);
        });
    });
});
