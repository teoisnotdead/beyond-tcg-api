import { Test, TestingModule } from '@nestjs/testing';
import { SalesAnalysisService } from './sales-analysis.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Sale } from '../entities/sale.entity';
import { DataSource } from 'typeorm';

describe('SalesAnalysisService', () => {
    let service: SalesAnalysisService;
    let dataSource: any;

    beforeEach(async () => {
        dataSource = {
            query: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesAnalysisService,
                { provide: getRepositoryToken(Sale), useValue: {} },
                { provide: DataSource, useValue: dataSource },
            ],
        }).compile();

        service = module.get<SalesAnalysisService>(SalesAnalysisService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('generateAnalysis', () => {
        it('should generate comprehensive sales analysis', async () => {
            const mockTrends = { sales_trend: {}, revenue_trend: {} };
            const mockPriceAnalysis = { price_distribution: [] };
            const mockCategoryAnalysis = { category_growth: [] };
            const mockUserBehavior = { seller_metrics: {} };

            dataSource.query
                .mockResolvedValueOnce([{ trends: mockTrends }])
                .mockResolvedValueOnce([{ price_analysis: mockPriceAnalysis }])
                .mockResolvedValueOnce([{ category_analysis: mockCategoryAnalysis }])
                .mockResolvedValueOnce([{ user_behavior: mockUserBehavior }]);

            const result = await service.generateAnalysis('user-1', {});

            expect(dataSource.query).toHaveBeenCalledTimes(4);
            expect(result).toHaveProperty('trends');
            expect(result).toHaveProperty('price_analysis');
            expect(result).toHaveProperty('category_analysis');
            expect(result).toHaveProperty('user_behavior');
        });
    });
});
