import { Test, TestingModule } from '@nestjs/testing';
import { SalesAnalysisService } from '../../src/sales/services/sales-analysis.service';
import { TestDbModule } from '../utils/test-db.module';
import { clearDatabase } from '../utils/db-test-setup';
import { DataSource, Repository } from 'typeorm';
import { Sale, SaleStatus } from '../../src/sales/entities/sale.entity';
import { User } from '../../src/users/entities/user.entity';
import { Store } from '../../src/stores/entities/store.entity';
import { Category } from '../../src/categories/entities/category.entity';
import { Language } from '../../src/languages/entities/language.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Purchase } from '../../src/purchases/entities/purchase.entity';

describe('SalesAnalysisService (Integration)', () => {
    let service: SalesAnalysisService;
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
            providers: [SalesAnalysisService],
        }).compile();

        service = module.get<SalesAnalysisService>(SalesAnalysisService);
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

    it('should generate sales analysis correctly', async () => {
        // 1. Setup Data
        const user = await userRepo.save(userRepo.create({
            email: 'test@example.com',
            name: 'testuser',
            password: 'password',
        }));

        const category1 = await categoryRepo.save(categoryRepo.create({
            name: 'TCG',
            slug: 'tcg',
        }));

        const category2 = await categoryRepo.save(categoryRepo.create({
            name: 'Merch',
            slug: 'merch',
        }));

        const language = await languageRepo.save(languageRepo.create({
            name: 'English',
            slug: 'en',
        }));

        const store = await storeRepo.save(storeRepo.create({
            name: 'Test Store',
            user: user,
        }));

        // Create sales with different dates and prices
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

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
                category: category1,
                language: language,
                created_at: today,
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
                category: category1,
                language: language,
                created_at: yesterday,
            },
            {
                name: 'Figurine',
                description: 'Desc',
                price: 200,
                quantity: 1,
                original_quantity: 1,
                status: SaleStatus.AVAILABLE,
                seller: user,
                store: store,
                category: category2,
                language: language,
                created_at: today,
            },
        ]);

        await saleRepo.save(salesData);

        // 2. Execute
        const analysis = await service.generateAnalysis(user.id, {
            comparison_period: 'days',
            periods: 7
        });

        // 3. Verify
        // Trends
        expect(analysis.trends).toBeDefined();
        // Price Analysis
        expect(analysis.price_analysis).toBeDefined();
        expect(analysis.price_analysis.average_price_by_category).toHaveLength(2); // TCG and Merch

        // Category Analysis
        expect(analysis.category_analysis).toBeDefined();
        expect(analysis.category_analysis.category_performance).toBeDefined();

        // User Behavior
        expect(analysis.user_behavior).toBeDefined();
        expect(analysis.user_behavior.seller_metrics).toBeDefined();
    });
});
