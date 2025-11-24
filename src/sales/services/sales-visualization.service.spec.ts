import { Test, TestingModule } from '@nestjs/testing';
import { SalesVisualizationService } from './sales-visualization.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Sale } from '../entities/sale.entity';
import { DataSource } from 'typeorm';

describe('SalesVisualizationService', () => {
    let service: SalesVisualizationService;

    beforeEach(async () => {
        const dataSource = {
            query: jest.fn().mockResolvedValue([]),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesVisualizationService,
                { provide: getRepositoryToken(Sale), useValue: {} },
                { provide: DataSource, useValue: dataSource },
            ],
        }).compile();

        service = module.get<SalesVisualizationService>(SalesVisualizationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('generateSalesTrendChart', () => {
        it('should generate sales trend chart data', async () => {
            const result = await service.generateSalesTrendChart('user-1', {});
            expect(result).toBeDefined();
        });
    });
});
