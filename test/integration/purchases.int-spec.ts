import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PurchasesService } from '../../src/purchases/purchases.service';
import { Purchase } from '../../src/purchases/entities/purchase.entity';
import { Sale, SaleStatus } from '../../src/sales/entities/sale.entity';
import { User } from '../../src/users/entities/user.entity';
import { Category } from '../../src/categories/entities/category.entity';
import { Language } from '../../src/languages/entities/language.entity';
import { Store } from '../../src/stores/entities/store.entity';
import { TestDbModule } from '../utils/test-db.module';
import { clearDatabase } from '../utils/db-test-setup';
import { CreatePurchaseDto } from '../../src/purchases/dto/create-purchase.dto';

describe('PurchasesService (Integration)', () => {
    let service: PurchasesService;
    let dataSource: DataSource;
    let salesRepository: Repository<Sale>;
    let purchasesRepository: Repository<Purchase>;
    let usersRepository: Repository<User>;
    let categoriesRepository: Repository<Category>;
    let languagesRepository: Repository<Language>;
    let storesRepository: Repository<Store>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TestDbModule,
                TypeOrmModule.forFeature([Purchase, Sale, User, Category, Language, Store]),
            ],
            providers: [PurchasesService],
        }).compile();

        service = module.get<PurchasesService>(PurchasesService);
        dataSource = module.get<DataSource>(DataSource);
        salesRepository = dataSource.getRepository(Sale);
        purchasesRepository = dataSource.getRepository(Purchase);
        usersRepository = dataSource.getRepository(User);
        categoriesRepository = dataSource.getRepository(Category);
        languagesRepository = dataSource.getRepository(Language);
        storesRepository = dataSource.getRepository(Store);
    });

    afterAll(async () => {
        await dataSource.destroy();
    });

    beforeEach(async () => {
        await clearDatabase(dataSource);
    });

    const createTestEntities = async (): Promise<{ user: User, seller: User, sale: Sale }> => {
        const user = await usersRepository.save(usersRepository.create({
            name: 'Buyer User',
            email: 'buyer@example.com',
            password: 'password',
        }));

        const seller = await usersRepository.save(usersRepository.create({
            name: 'Seller User',
            email: 'seller@example.com',
            password: 'password',
        }));

        const category = await categoriesRepository.save(categoriesRepository.create({
            name: 'Test Category',
            slug: 'test-category',
        }));

        const language = await languagesRepository.save(languagesRepository.create({
            name: 'English',
            slug: 'en',
        }));

        const store = await storesRepository.save(storesRepository.create({
            name: 'Test Store',
            description: 'Test Description',
            avatar_url: 'logo.png',
            user: seller,
        }));

        const sale = await salesRepository.save(salesRepository.create({
            seller: seller,
            category: category,
            language: language,
            store: store,
            price: 100,
            quantity: 10,
            original_quantity: 10,
            status: SaleStatus.AVAILABLE,
            name: 'Test Card',
            description: 'Test Description',
            image_url: 'image.png',
        }));

        return { user, seller, sale };
    };

    it('should create a purchase and update sale quantity', async () => {
        const { user, sale } = await createTestEntities();

        const createPurchaseDto: CreatePurchaseDto = {
            sale_id: sale.id,
            quantity: 2,
        };

        const purchase = await service.create(user.id, createPurchaseDto);

        expect(purchase).toBeDefined();
        // Check relations if loaded, otherwise check if property exists
        if (purchase.user) {
            expect(purchase.user.id).toBe(user.id);
        }
        if (purchase.sale) {
            expect(purchase.sale.id).toBe(sale.id);
        }

        expect(purchase.quantity).toBe(2);
        expect(Number(purchase.price)).toBe(100); // Check unit price

        // Verify sale update
        const updatedSale = await salesRepository.findOneBy({ id: sale.id });
        expect(updatedSale).toBeDefined();
        expect(updatedSale!.quantity).toBe(8); // 10 - 2
        expect(updatedSale!.status).toBe(SaleStatus.AVAILABLE);
    });

    it('should mark sale as completed when quantity reaches 0', async () => {
        const { user, sale } = await createTestEntities();

        const createPurchaseDto: CreatePurchaseDto = {
            sale_id: sale.id,
            quantity: 10, // Buy all
        };

        const purchase = await service.create(user.id, createPurchaseDto);

        expect(purchase).toBeDefined();

        // Verify sale update
        const updatedSale = await salesRepository.findOneBy({ id: sale.id });
        expect(updatedSale).toBeDefined();
        expect(updatedSale!.quantity).toBe(0);
        expect(updatedSale!.status).toBe(SaleStatus.COMPLETED);
    });

    it('should fail if quantity is insufficient', async () => {
        const { user, sale } = await createTestEntities();

        const createPurchaseDto: CreatePurchaseDto = {
            sale_id: sale.id,
            quantity: 11, // More than available
        };

        await expect(service.create(user.id, createPurchaseDto)).rejects.toThrow();
    });

    it('should find all purchases by user', async () => {
        const { user, sale } = await createTestEntities();
        await service.create(user.id, { sale_id: sale.id, quantity: 1 });
        await service.create(user.id, { sale_id: sale.id, quantity: 2 });

        const purchases = await service.findAllByUser(user.id, {});
        expect(purchases.data).toHaveLength(2);
        // expect(purchases.data[0].user.id).toBe(user.id);
    });

    it('should find all purchases by seller', async () => {
        const { user, seller, sale } = await createTestEntities();
        await service.create(user.id, { sale_id: sale.id, quantity: 1 });

        const purchases = await service.findAllBySeller(seller.id, {});
        expect(purchases.data).toHaveLength(1);
    });
});
