import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, QueryRunner } from 'typeorm';
import { SalesStateService } from './sales-state.service';
import { Sale, SaleStatus } from '../entities/sale.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('SalesStateService', () => {
    let service: SalesStateService;
    let salesRepository: Repository<Sale>;
    let dataSource: DataSource;
    let notificationsService: NotificationsService;
    let queryRunner: QueryRunner;

    beforeEach(async () => {
        queryRunner = {
            connect: jest.fn(),
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            release: jest.fn(),
            manager: {
                findOne: jest.fn(),
                save: jest.fn(),
                query: jest.fn(),
                remove: jest.fn(),
            },
        } as any;

        const dataSourceMock = {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
        };

        const notificationsServiceMock = {
            create: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesStateService,
                {
                    provide: getRepositoryToken(Sale),
                    useClass: Repository,
                },
                {
                    provide: DataSource,
                    useValue: dataSourceMock,
                },
                {
                    provide: NotificationsService,
                    useValue: notificationsServiceMock,
                },
            ],
        }).compile();

        service = module.get<SalesStateService>(SalesStateService);
        salesRepository = module.get<Repository<Sale>>(getRepositoryToken(Sale));
        dataSource = module.get<DataSource>(DataSource);
        notificationsService = module.get<NotificationsService>(NotificationsService);
    });

    describe('confirmDelivery', () => {
        it('should confirm delivery and create purchase using transaction', async () => {
            const saleId = 'sale-1';
            const userId = 'buyer-1';
            const dto = { saleId, deliveryProofUrl: 'http://proof.url' };

            const sale = {
                id: saleId,
                seller: { id: 'seller-1' },
                buyer: { id: userId },
                status: SaleStatus.SHIPPED,
                quantity: 1,
                reserved_quantity: 1,
                price: 100,
                name: 'Test Sale',
                description: 'Desc',
                image_url: 'img.jpg',
                language: { id: 'lang-1' },
                category: { id: 'cat-1' },
            } as Sale;

            (queryRunner.manager.findOne as jest.Mock).mockResolvedValue(sale);

            await service.confirmDelivery(dto, userId);

            expect(dataSource.createQueryRunner).toHaveBeenCalled();
            expect(queryRunner.connect).toHaveBeenCalled();
            expect(queryRunner.startTransaction).toHaveBeenCalled();

            // Verify lock usage
            expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Sale, expect.objectContaining({
                where: { id: saleId },
                lock: { mode: 'pessimistic_write' }
            }));

            // Verify raw SQL execution for purchase
            expect(queryRunner.manager.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO purchases'),
                expect.any(Array)
            );

            // Verify sale update
            expect(queryRunner.manager.save).toHaveBeenCalledWith(expect.objectContaining({
                status: SaleStatus.COMPLETED,
                delivery_proof_url: dto.deliveryProofUrl,
            }));

            expect(queryRunner.commitTransaction).toHaveBeenCalled();
            expect(queryRunner.release).toHaveBeenCalled();
            expect(notificationsService.create).toHaveBeenCalledTimes(2); // Delivered and Completed notifications
        });

        it('should rollback transaction on error', async () => {
            const saleId = 'sale-1';
            const userId = 'buyer-1';
            const dto = { saleId, deliveryProofUrl: 'http://proof.url' };

            (queryRunner.manager.findOne as jest.Mock).mockRejectedValue(new Error('DB Error'));

            await expect(service.confirmDelivery(dto, userId)).rejects.toThrow('DB Error');

            expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
            expect(queryRunner.release).toHaveBeenCalled();
        });
    });
});
