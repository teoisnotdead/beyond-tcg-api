import { Test, TestingModule } from '@nestjs/testing';
import { SalesStatisticsService } from './sales-statistics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Sale } from '../entities/sale.entity';
import { DataSource } from 'typeorm';

describe('SalesStatisticsService', () => {
    let service: SalesStatisticsService;
    let dataSource: { query: jest.Mock };

    beforeEach(async () => {
        dataSource = {
            query: jest.fn(),
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

    it('getUserStatistics should aggregate all metric queries', async () => {
        dataSource.query
            .mockResolvedValueOnce([{
                active_listings: '2',
                completed_sales: '3',
                cancelled_sales: '1',
                total_sales: '6',
                total_revenue: '1200.5',
                average_sale_price: '200.08',
                average_time_to_sell: '24',
                conversion_rate: '0.5',
            }])
            .mockResolvedValueOnce([{
                total_orders: '4',
                total_spent: '800.2',
                average_order_value: '200.05',
                favorite_categories: [
                    {
                        category_id: 'cat-1',
                        category_name: 'Pokemon',
                        purchase_count: 2,
                        total_spent: 400,
                    },
                ],
            }])
            .mockResolvedValueOnce([{
                last_activity: '2026-01-01T00:00:00.000Z',
                average_response_time: '12',
                completion_rate: '0.75',
                cancellation_rate: '0.25',
            }])
            .mockResolvedValueOnce([{
                daily_sales: [{ date: '2026-01-01', count: '2', revenue: '500' }],
                daily_purchases: [{ date: '2026-01-01', count: '1', spent: '200' }],
            }])
            .mockResolvedValueOnce([{ average_rating: '4.5' }]);

        const result = await service.getUserStatistics('user-1');

        expect(dataSource.query).toHaveBeenCalledTimes(5);
        expect(result.total_sales).toBe(6);
        expect(result.total_purchases).toBe(4);
        expect(result.total_revenue).toBe(1200.5);
        expect(result.total_spent).toBe(800.2);
        expect(result.average_rating).toBe(4.5);
        expect(result.sales_metrics.active_listings).toBe(2);
        expect(result.sales_metrics.conversion_rate).toBe(50);
        expect(result.activity_metrics.completion_rate).toBe(75);
        expect(result.activity_metrics.cancellation_rate).toBe(25);
        expect(result.recent_trends.daily_sales).toHaveLength(1);
    });

    it('getSalesMetrics query should use available status and completed_at delta', async () => {
        dataSource.query.mockResolvedValueOnce([{
            active_listings: '0',
            completed_sales: '0',
            cancelled_sales: '0',
            total_sales: '0',
            total_revenue: null,
            average_sale_price: null,
            average_time_to_sell: null,
            conversion_rate: null,
        }]);

        const metrics = await (service as any).getSalesMetrics('user-1');
        const [sql] = dataSource.query.mock.calls[0];

        expect(sql).toContain("status = 'available'");
        expect(sql).toContain('completed_at - created_at');
        expect(metrics.active_listings).toBe(0);
        expect(metrics.total_revenue).toBe(0);
        expect(metrics.average_sale_price).toBe(0);
        expect(metrics.average_time_to_sell).toBe(0);
        expect(metrics.conversion_rate).toBe(0);
    });

    it('getPurchaseMetrics query should read from purchases table', async () => {
        dataSource.query.mockResolvedValueOnce([{
            total_orders: '0',
            total_spent: null,
            average_order_value: null,
            favorite_categories: null,
        }]);

        const metrics = await (service as any).getPurchaseMetrics('user-1');
        const [sql] = dataSource.query.mock.calls[0];

        expect(sql).toContain('FROM purchases');
        expect(sql).toContain('WHERE user_id = $1');
        expect(metrics.total_orders).toBe(0);
        expect(metrics.total_spent).toBe(0);
        expect(metrics.average_order_value).toBe(0);
        expect(metrics.favorite_categories).toEqual([]);
    });

    it('getAverageRating query should use userratings and storeratings', async () => {
        dataSource.query.mockResolvedValueOnce([{ average_rating: null }]);

        const rating = await (service as any).getAverageRating('user-1');
        const [sql] = dataSource.query.mock.calls[0];

        expect(sql).toContain('FROM userratings');
        expect(sql).toContain('FROM storeratings');
        expect(rating).toBe(0);
    });
});
