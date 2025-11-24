import { Test, TestingModule } from '@nestjs/testing';
import { SalesMetricsService } from './sales-metrics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Sale } from '../entities/sale.entity';
import { Purchase } from '../../purchases/entities/purchase.entity';
import { DataSource } from 'typeorm';

describe('SalesMetricsService', () => {
    let service: SalesMetricsService;
    let dataSource: any;

    beforeEach(async () => {
        dataSource = {
            query: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesMetricsService,
                { provide: getRepositoryToken(Sale), useValue: {} },
                { provide: getRepositoryToken(Purchase), useValue: {} },
                { provide: DataSource, useValue: dataSource },
            ],
        }).compile();

        service = module.get<SalesMetricsService>(SalesMetricsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getSalesMetrics', () => {
        it('should return comprehensive sales metrics', async () => {
            const mockMetrics = {
                total_sales: '10',
                total_revenue: '1000',
                average_sale_price: '100',
                average_sales_per_day: '2',
                conversion_rate: '0.8',
                available_count: '2',
                reserved_count: '1',
                shipped_count: '2',
                delivered_count: '2',
                completed_count: '3',
                cancelled_count: '0',
                today_sales: '1',
                yesterday_sales: '2',
                this_week_sales: '5',
                last_week_sales: '3',
                this_month_sales: '10',
                last_month_sales: '8',
                today_revenue: '100',
                yesterday_revenue: '200',
                this_week_revenue: '500',
                last_week_revenue: '300',
                this_month_revenue: '1000',
                last_month_revenue: '800',
                average_shipping_time: '24',
                delivery_success_rate: '1.0',
                category_performance: [],
                store_performance: [],
            };

            dataSource.query.mockResolvedValue([mockMetrics]);

            const result = await service.getSalesMetrics('user-1');

            expect(dataSource.query).toHaveBeenCalled();
            expect(result).toHaveProperty('total_sales');
            expect(result).toHaveProperty('total_revenue');
            expect(result).toHaveProperty('sales_by_status');
            expect(result).toHaveProperty('sales_by_period');
            expect(result).toHaveProperty('revenue_by_period');
            expect(result).toHaveProperty('shipping_metrics');
            expect(result.total_sales).toBe(10);
            expect(result.total_revenue).toBe(1000);
        });
    });
});
