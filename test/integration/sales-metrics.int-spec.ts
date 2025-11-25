import { Test, TestingModule } from '@nestjs/testing';
import { SalesMetricsService } from '../../src/sales/services/sales-metrics.service';
import { TestDbModule } from '../utils/test-db.module';
import { clearDatabase } from '../utils/db-test-setup';
import { DataSource, Repository } from 'typeorm';
import { Sale, SaleStatus } from '../../src/sales/entities/sale.entity';
import { Purchase } from '../../src/purchases/entities/purchase.entity';
import { User } from '../../src/users/entities/user.entity';
import { Store } from '../../src/stores/entities/store.entity';
import { Category } from '../../src/categories/entities/category.entity';
import { Language } from '../../src/languages/entities/language.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('SalesMetricsService (Integration)', () => {
    let service: SalesMetricsService;
    let dataSource: DataSource;
    let saleRepo: Repository<Sale>;
    let userRepo: Repository<User>;
    let storeRepo: Repository<Store>;
    let categoryRepo: Repository<Category>;
    let languageRepo: Repository<Language>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TestDbModule,
                TypeOrmModule.forFeature([Sale, Purchase, User, Store, Category, Language]),
            ],
            providers: [SalesMetricsService],
        }).compile();

        service = module.get<SalesMetricsService>(SalesMetricsService);
        dataSource = module.get<DataSource>(DataSource);
        saleRepo = dataSource.getRepository(Sale);
        userRepo = dataSource.getRepository(User);
        storeRepo = dataSource.getRepository(Store);
        categoryRepo = dataSource.getRepository(Category);
        languageRepo = dataSource.getRepository(Language);
    });

    beforeEach(async () => {
        await clearDatabase(dataSource);
    });

    afterAll(async () => {
        await dataSource.destroy();
    });

    it('should calculate sales metrics correctly', async () => {
        // 1. Setup Data
        const user = await userRepo.save(userRepo.create({
            email: 'test@example.com',
            name: 'testuser',
            password: 'password',
        }));

        const category = await categoryRepo.save(categoryRepo.create({
            name: 'TCG',
            slug: 'tcg',
        }));

        const language = await languageRepo.save(languageRepo.create({
            name: 'English',
            slug: 'en',
        }));

        const store = await storeRepo.save(storeRepo.create({
            name: 'Test Store',
            user: user,
        }));

        // Create sales with different statuses and prices
        const salesData = saleRepo.create([
            {
                name: 'Card 1',
                description: 'Desc',
                price: 100,
                quantity: 1,
                original_quantity: 1,
                status: SaleStatus.COMPLETED,
                seller: user,
                store: store,
                category: category,
                language: language,
                created_at: new Date(),
            },
            {
                name: 'Card 2',
                description: 'Desc',
                price: 50,
                quantity: 2,
                original_quantity: 2,
                status: SaleStatus.COMPLETED,
                seller: user,
                store: store,
                category: category,
                language: language,
                created_at: new Date(),
            },
            {
                name: 'Card 3',
                description: 'Desc',
                price: 200,
                quantity: 1,
                original_quantity: 1,
                status: SaleStatus.AVAILABLE,
                seller: user,
                store: store,
                category: category,
                language: language,
                created_at: new Date(),
            },
        ]);

        await saleRepo.save(salesData);

        // 2. Execute
        const metrics = await service.getSalesMetrics(user.id);

        // 3. Verify
        expect(metrics.total_sales).toBe(3);
        // Revenue: (100*1) + (50*2) + (200*1) = 400
        expect(metrics.total_revenue).toBe(400);
        // Average Price: 400 / 3 = 133.33...
        expect(metrics.average_sale_price).toBeCloseTo(133.33, 2);

        expect(metrics.sales_by_status[SaleStatus.COMPLETED]).toBe(2);
        expect(metrics.sales_by_status[SaleStatus.AVAILABLE]).toBe(1);

        expect(metrics.revenue_by_period.today).toBe(400);
    });
});
