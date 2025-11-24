import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StoresService } from './stores.service';
import { Store } from './entities/store.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { StoreSocialLink } from './entities/store-social-link.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

describe('StoresService', () => {
    let service: StoresService;
    let salesRepository: any;

    beforeEach(async () => {
        const mockQueryBuilder = {
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            getRawOne: jest.fn(),
            getRawMany: jest.fn(),
        };

        salesRepository = {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            query: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StoresService,
                { provide: getRepositoryToken(Store), useValue: {} },
                { provide: getRepositoryToken(StoreSocialLink), useValue: {} },
                { provide: getRepositoryToken(Sale), useValue: salesRepository },
                { provide: getRepositoryToken(Favorite), useValue: { createQueryBuilder: jest.fn(() => mockQueryBuilder) } },
                { provide: CloudinaryService, useValue: {} },
            ],
        }).compile();

        service = module.get<StoresService>(StoresService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getStatistics', () => {
        it('should calculate statistics using database aggregation', async () => {
            const storeId = 'store-1';

            const mockQueryBuilder = salesRepository.createQueryBuilder();
            mockQueryBuilder.getRawOne
                .mockResolvedValueOnce({ totalSales: '10', totalRevenue: '1000' })
                .mockResolvedValueOnce({ totalViews: '500' })
                .mockResolvedValueOnce({ totalFavorites: '25' });

            mockQueryBuilder.getRawMany.mockResolvedValueOnce([
                { name: 'Product A', sales: '15', revenue: '300', favorites: '5' },
                { name: 'Product B', sales: '10', revenue: '200', favorites: '3' },
            ]);

            salesRepository.query.mockResolvedValue([
                { month: '2024-01', sales: '5', revenue: '500' },
                { month: '2024-02', sales: '5', revenue: '500' },
            ]);

            const result = await service.getStatistics(storeId);

            expect(result).toEqual({
                totalSales: 10,
                totalRevenue: 1000,
                totalViews: 500,
                totalFavorites: 25,
                topProducts: [
                    { name: 'Product A', sales: 15, revenue: 300, favorites: 5 },
                    { name: 'Product B', sales: 10, revenue: 200, favorites: 3 },
                ],
                salesByMonth: [
                    { month: '2024-01', sales: 5, revenue: 500 },
                    { month: '2024-02', sales: 5, revenue: 500 },
                ],
            });

            expect(salesRepository.createQueryBuilder).toHaveBeenCalled();
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('sale.store_id = :storeId', { storeId });
        });

        it('should handle stores with no sales', async () => {
            const storeId = 'store-empty';

            const mockQueryBuilder = salesRepository.createQueryBuilder();
            mockQueryBuilder.getRawOne
                .mockResolvedValueOnce({ totalSales: '0', totalRevenue: null })
                .mockResolvedValueOnce({ totalViews: null })
                .mockResolvedValueOnce({ totalFavorites: '0' });

            mockQueryBuilder.getRawMany.mockResolvedValueOnce([]);
            salesRepository.query.mockResolvedValue([]);

            const result = await service.getStatistics(storeId);

            expect(result.totalSales).toBe(0);
            expect(result.totalRevenue).toBe(0);
            expect(result.totalViews).toBe(0);
            expect(result.topProducts).toEqual([]);
            expect(result.salesByMonth).toEqual([]);
        });
    });
});
