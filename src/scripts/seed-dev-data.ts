import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Development Seed Data Script
 * 
 * This script creates test data for frontend development:
 * - Test users (buyer, seller, store owner)
 * - Sample sales with various statuses
 * - Sample purchases
 * 
 * Usage: npm run seed:dev
 */

async function seedDevelopmentData() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'beyond_tcg',
    });

    try {
        await dataSource.initialize();
        console.log('✅ Database connected');

        const queryRunner = dataSource.createQueryRunner();

        // 1. Create test users
        console.log('\n📝 Creating test users...');
        const buyerPassword = await bcrypt.hash('Buyer1234', 10);
        const sellerPassword = await bcrypt.hash('Seller1234', 10);
        const storePassword = await bcrypt.hash('Store1234', 10);

        // Get Free and Store plans
        const [freePlan] = await queryRunner.query(
            `SELECT id FROM subscriptionplans WHERE name = 'Free' LIMIT 1`
        );
        const [storePlan] = await queryRunner.query(
            `SELECT id FROM subscriptionplans WHERE name = 'Tienda' LIMIT 1`
        );

        // Create buyer user
        await queryRunner.query(`
      INSERT INTO users (id, name, email, password, role, is_store, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'Juan Comprador',
        'buyer@test.com',
        '${buyerPassword}',
        'user',
        false,
        now(),
        now()
      )
      ON CONFLICT (email) DO NOTHING;
    `);

        // Create seller user
        await queryRunner.query(`
      INSERT INTO users (id, name, email, password, role, is_store, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'María Vendedora',
        'seller@test.com',
        '${sellerPassword}',
        'user',
        false,
        now(),
        now()
      )
      ON CONFLICT (email) DO NOTHING;
    `);

        // Create store owner user
        await queryRunner.query(`
      INSERT INTO users (id, name, email, password, role, is_store, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'Pedro Tienda',
        'store@test.com',
        '${storePassword}',
        'user',
        true,
        now(),
        now()
      )
      ON CONFLICT (email) DO NOTHING;
    `);

        console.log('✅ Test users created:');
        console.log('   - buyer@test.com / Buyer1234');
        console.log('   - seller@test.com / Seller1234');
        console.log('   - store@test.com / Store1234');

        // 2. Create subscriptions for users
        console.log('\n📝 Creating user subscriptions...');

        const [buyer] = await queryRunner.query(`SELECT id FROM users WHERE email = 'buyer@test.com'`);
        const [seller] = await queryRunner.query(`SELECT id FROM users WHERE email = 'seller@test.com'`);
        const [storeOwner] = await queryRunner.query(`SELECT id FROM users WHERE email = 'store@test.com'`);

        // Buyer - Free plan
        await queryRunner.query(`
      INSERT INTO usersubscriptions (id, user_id, plan_id, start_date, end_date, is_active)
      VALUES (
        gen_random_uuid(),
        '${buyer.id}',
        '${freePlan.id}',
        now(),
        now() + interval '10 years',
        true
      )
      ON CONFLICT DO NOTHING;
    `);

        // Seller - Free plan
        await queryRunner.query(`
      INSERT INTO usersubscriptions (id, user_id, plan_id, start_date, end_date, is_active)
      VALUES (
        gen_random_uuid(),
        '${seller.id}',
        '${freePlan.id}',
        now(),
        now() + interval '10 years',
        true
      )
      ON CONFLICT DO NOTHING;
    `);

        // Store owner - Store plan
        await queryRunner.query(`
      INSERT INTO usersubscriptions (id, user_id, plan_id, start_date, end_date, is_active)
      VALUES (
        gen_random_uuid(),
        '${storeOwner.id}',
        '${storePlan.id}',
        now(),
        now() + interval '30 days',
        true
      )
      ON CONFLICT DO NOTHING;
    `);

        // 3. Create a store for the store owner
        console.log('\n📝 Creating test store...');
        await queryRunner.query(`
      INSERT INTO stores (id, user_id, name, description, location, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        '${storeOwner.id}',
        'Tienda de Cartas TCG',
        'La mejor tienda de cartas coleccionables de Chile. Especialistas en Pokémon, Yu-Gi-Oh! y Magic.',
        'Santiago, Chile',
        now(),
        now()
      )
      ON CONFLICT (user_id) DO NOTHING;
    `);

        const [store] = await queryRunner.query(`SELECT id FROM stores WHERE user_id = '${storeOwner.id}'`);
        console.log('✅ Store created: Tienda de Cartas TCG');

        // 4. Get categories and languages for sales
        const [pokemonCategory] = await queryRunner.query(`SELECT id FROM categories WHERE slug = 'pokemon'`);
        const [yugiohCategory] = await queryRunner.query(`SELECT id FROM categories WHERE slug = 'yu-gi-oh'`);
        const [magicCategory] = await queryRunner.query(`SELECT id FROM categories WHERE slug = 'magic-the-gathering'`);
        const [spanishLang] = await queryRunner.query(`SELECT id FROM languages WHERE slug = 'espanol'`);
        const [englishLang] = await queryRunner.query(`SELECT id FROM languages WHERE slug = 'ingles'`);

        // 5. Create sample sales
        console.log('\n📝 Creating sample sales...');

        const sampleSales = [
            {
                name: 'Charizard VMAX - Rainbow Rare',
                description: 'Carta Charizard VMAX Rainbow Rare en perfecto estado. Directamente del sobre a protector.',
                price: 150000,
                quantity: 1,
                category: pokemonCategory.id,
                language: spanishLang.id,
                status: 'available',
            },
            {
                name: 'Blue-Eyes White Dragon - 1st Edition',
                description: 'Blue-Eyes White Dragon de primera edición. Carta en excelente estado.',
                price: 85000,
                quantity: 2,
                category: yugiohCategory.id,
                language: englishLang.id,
                status: 'available',
            },
            {
                name: 'Black Lotus - Alpha',
                description: 'Black Lotus de Alpha. Carta de colección en muy buen estado.',
                price: 5000000,
                quantity: 1,
                category: magicCategory.id,
                language: englishLang.id,
                status: 'available',
            },
            {
                name: 'Pikachu VMAX - Full Art',
                description: 'Pikachu VMAX Full Art. Carta recién sacada del sobre.',
                price: 45000,
                quantity: 3,
                category: pokemonCategory.id,
                language: spanishLang.id,
                status: 'available',
            },
            {
                name: 'Dark Magician - Ultra Rare',
                description: 'Dark Magician Ultra Rare. Perfecto para coleccionistas.',
                price: 35000,
                quantity: 0,
                category: yugiohCategory.id,
                language: spanishLang.id,
                status: 'completed',
            },
        ];

        for (const sale of sampleSales) {
            await queryRunner.query(`
        INSERT INTO sales (
          id, seller_id, store_id, category_id, language_id,
          name, description, price, quantity, original_quantity,
          status, created_at
        )
        VALUES (
          gen_random_uuid(),
          '${seller.id}',
          ${store ? `'${store.id}'` : 'NULL'},
          '${sale.category}',
          '${sale.language}',
          '${sale.name}',
          '${sale.description}',
          ${sale.price},
          ${sale.quantity},
          ${sale.quantity === 0 ? 1 : sale.quantity},
          '${sale.status}',
          now() - interval '${Math.floor(Math.random() * 30)} days'
        );
      `);
        }

        console.log(`✅ Created ${sampleSales.length} sample sales`);

        // 6. Create a sample purchase
        console.log('\n📝 Creating sample purchase...');
        const [completedSale] = await queryRunner.query(`
      SELECT id, price FROM sales WHERE status = 'completed' LIMIT 1
    `);

        if (completedSale) {
            await queryRunner.query(`
        INSERT INTO purchases (
          id, user_id, sale_id, seller_id,
          name, description, price, quantity,
          language_id, category_id, created_at
        )
        SELECT
          gen_random_uuid(),
          '${buyer.id}',
          s.id,
          s.seller_id,
          s.name,
          s.description,
          s.price,
          1,
          s.language_id,
          s.category_id,
          now() - interval '5 days'
        FROM sales s
        WHERE s.id = '${completedSale.id}';
      `);
            console.log('✅ Sample purchase created');
        }

        console.log('\n✅ Development seed data created successfully!');
        console.log('\n📋 Summary:');
        console.log('   - 3 test users created');
        console.log('   - 1 test store created');
        console.log('   - 5 sample sales created');
        console.log('   - 1 sample purchase created');
        console.log('\n🔐 Test Credentials:');
        console.log('   Buyer:  buyer@test.com  / Buyer1234');
        console.log('   Seller: seller@test.com / Seller1234');
        console.log('   Store:  store@test.com  / Store1234');

        await queryRunner.release();
        await dataSource.destroy();
    } catch (error) {
        console.error('❌ Error seeding development data:', error);
        process.exit(1);
    }
}

// Run the seed script
seedDevelopmentData();
