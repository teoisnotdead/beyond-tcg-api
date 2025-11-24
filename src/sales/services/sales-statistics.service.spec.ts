import { Test, TestingModule } from '@nestjs/testing';
import { SalesStatisticsService } from './sales-statistics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Sale } from '../entities/sale.entity';
import { DataSource } from 'typeorm';

describe('SalesStatisticsService', () => {
    let service: SalesStatisticsService;

    beforeEach(async () => {
        const dataSource = {
            query: jest.fn().mockResolvedValue([{
                total_sales: 0,
                total_revenue: 0,
            }]),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesStatisticsService,
                { provide: getRepositoryToken(Sale), useValue: {} },
                { provide: DataSource, useValue: dataSource },
            ],
        }).compile();

        service = module.get<SalesStatisticsService>(SalesStatisticsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
