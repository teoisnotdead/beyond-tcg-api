import { Test, TestingModule } from '@nestjs/testing';
import { SalesHistoryService } from './sales-history.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Sale } from '../entities/sale.entity';
import { Purchase } from '../../purchases/entities/purchase.entity';
import { DataSource } from 'typeorm';

describe('SalesHistoryService', () => {
    let service: SalesHistoryService;
    let salesRepository: any;
    let purchasesRepository: any;
    let dataSource: any;

    beforeEach(async () => {
        const mockQueryBuilder = {
            select: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getQuery: jest.fn().mockReturnValue('SELECT * FROM sales'),
            getRawOne: jest.fn().mockResolvedValue({}),
        };

        salesRepository = {
            find: jest.fn(),
            findOne: jest.fn(),
        };

        purchasesRepository = {
            find: jest.fn(),
            findOne: jest.fn(),
        };

        dataSource = {
            query: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesHistoryService,
                { provide: getRepositoryToken(Sale), useValue: salesRepository },
                { provide: getRepositoryToken(Purchase), useValue: purchasesRepository },
                { provide: DataSource, useValue: dataSource },
            ],
        }).compile();

        service = module.get<SalesHistoryService>(SalesHistoryService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getSalesHistory', () => {
        it('should return paginated history with stats', async () => {
            const mockResults = [
                {
                    id: 'sale-1',
                    name: 'Test Sale',
                    price: 100,
                    quantity: 1,
                    status: 'available',
                },
            ];

            const mockStats = {
                total_count: '1',
                total_revenue: '100',
                available_count: '1',
                reserved_count: '0',
                shipped_count: '0',
                delivered_count: '0',
                completed_count: '0',
                cancelled_count: '0',
                today_count: '1',
                week_count: '1',
                month_count: '1',
            };

            dataSource.query
                .mockResolvedValueOnce(mockResults)
                .mockResolvedValueOnce([mockStats]);

            const result = await service.getSalesHistory('user-1', {});

            expect(dataSource.query).toHaveBeenCalledTimes(2);
            expect(result).toHaveProperty('items');
            expect(result).toHaveProperty('total');
            expect(result).toHaveProperty('stats');
            expect(result.total).toBe(1);
        });

        it('should handle empty results', async () => {
            const mockStats = {
                total_count: '0',
                total_revenue: '0',
                available_count: '0',
                reserved_count: '0',
                shipped_count: '0',
                delivered_count: '0',
                completed_count: '0',
                cancelled_count: '0',
                today_count: '0',
                week_count: '0',
                month_count: '0',
            };

            dataSource.query
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([mockStats]);

            const result = await service.getSalesHistory('user-1', {});

            expect(result.items).toEqual([]);
            expect(result.total).toBe(0);
        });
    });
});
