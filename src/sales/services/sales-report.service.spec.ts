import { Test, TestingModule } from '@nestjs/testing';
import { SalesReportService } from './sales-report.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Sale } from '../entities/sale.entity';
import { DataSource } from 'typeorm';

describe('SalesReportService', () => {
    let service: SalesReportService;

    beforeEach(async () => {
        const dataSource = {
            query: jest.fn().mockResolvedValue([{
                period: '2024-01',
                total_sales: 0,
                total_revenue: 0,
            }]),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesReportService,
                { provide: getRepositoryToken(Sale), useValue: {} },
                { provide: DataSource, useValue: dataSource },
            ],
        }).compile();

        service = module.get<SalesReportService>(SalesReportService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
