import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class InitialMigration1716220000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tablas principales
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        role VARCHAR(20) DEFAULT 'user',
        is_store BOOLEAN DEFAULT false,
        google_id VARCHAR(255),
        avatar_url VARCHAR(255),
        current_subscription_id UUID,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        refresh_token TEXT,
        refresh_token_expires_at TIMESTAMP
      );
    `);

    await queryRunner.query(`
      CREATE TABLE subscriptionplans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        price DECIMAL(10, 2) NOT NULL,
        duration_days INTEGER NOT NULL,
        description TEXT,
        features JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE usersubscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        plan_id UUID REFERENCES subscriptionplans(id) ON DELETE RESTRICT,
        start_date TIMESTAMP NOT NULL DEFAULT now(),
        end_date TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT true,
        payment_id VARCHAR(255),
        auto_renew BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    // Relación de users con usersubscriptions
    await queryRunner.query(`
      ALTER TABLE users ADD CONSTRAINT fk_users_subscription
      FOREIGN KEY (current_subscription_id) REFERENCES usersubscriptions(id) ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      CREATE TABLE categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE languages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE stores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) UNIQUE,
        name VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(255),
        banner_url VARCHAR(255),
        description TEXT,
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE storesociallinks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        url VARCHAR(255) NOT NULL
      );
    `);

    await queryRunner.query(`
      CREATE TABLE sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
        store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        image_url VARCHAR(255),
        quantity INTEGER NOT NULL CHECK (quantity >= 0),
        status VARCHAR(20) DEFAULT 'available',
        views INTEGER DEFAULT 0,
        category_id UUID REFERENCES categories(id) NOT NULL,
        language_id UUID REFERENCES languages(id) NOT NULL,
        shipping_proof_url VARCHAR(255),
        delivery_proof_url VARCHAR(255),
        reserved_at TIMESTAMP,
        shipped_at TIMESTAMP,
        delivered_at TIMESTAMP,
        completed_at TIMESTAMP,
        cancelled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
        store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
        target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
        seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        image_url VARCHAR(255),
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        language_id UUID REFERENCES languages(id) NOT NULL,
        category_id UUID REFERENCES categories(id) NOT NULL,
        created_at TIMESTAMP DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE favorites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT now(),
        UNIQUE(user_id, sale_id)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE storeratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
        rater_id UUID REFERENCES users(id) ON DELETE SET NULL,
        sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT now(),
        UNIQUE (sale_id, rater_id)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE userratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        rater_id UUID REFERENCES users(id) ON DELETE SET NULL,
        sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT now(),
        UNIQUE (sale_id, rater_id)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        is_read BOOLEAN DEFAULT false,
        related_entity_id UUID,
        related_entity_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    // 2. Crear índices
    await queryRunner.query(`CREATE INDEX idx_users_email ON users(email);`);
    await queryRunner.query(
      `CREATE INDEX idx_categories_slug ON categories(slug);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_categories_display_order ON categories(display_order);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_languages_slug ON languages(slug);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_languages_display_order ON languages(display_order);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_notifications_user_id ON notifications(user_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_notifications_is_read ON notifications(is_read);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_notifications_created_at ON notifications(created_at);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_usersubscriptions_user_id ON usersubscriptions(user_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_usersubscriptions_end_date ON usersubscriptions(end_date);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_usersubscriptions_is_active ON usersubscriptions(is_active);`,
    );

    // 3. Insertar datos iniciales
    await queryRunner.query(`
      INSERT INTO categories (name, slug, description, display_order) VALUES
      ('Digimon', 'digimon', 'Cartas coleccionables del juego Digimon Card Game', 1),
      ('Dragon Ball Fusion World', 'dragon-ball-fusion-world', 'Cartas del juego Dragon Ball Fusion World', 2),
      ('Dragon Ball Masters', 'dragon-ball-masters', 'Cartas del juego Dragon Ball Super Card Game', 3),
      ('Gundam Card Game', 'gundam-card-game', 'Cartas del juego Gundam Card Game', 4),
      ('Magic the gathering', 'magic-the-gathering', 'Cartas del juego Magic: The Gathering', 5),
      ('Mitos y leyendas', 'mitos-y-leyendas', 'Cartas del juego Mitos y Leyendas', 6),
      ('One Piece', 'one-piece', 'Cartas del juego One Piece Card Game', 7),
      ('Otro', 'otro', 'Otras cartas y productos coleccionables', 8),
      ('Pokémon', 'pokemon', 'Cartas del juego Pokémon Trading Card Game', 9),
      ('Union Arena', 'union-arena', 'Cartas del juego Union Arena', 10),
      ('Yu-Gi-Oh', 'yu-gi-oh', 'Cartas del juego Yu-Gi-Oh! Trading Card Game', 11)
      ON CONFLICT (slug) DO UPDATE 
      SET name = EXCLUDED.name,
          description = EXCLUDED.description,
          display_order = EXCLUDED.display_order,
          updated_at = now();
    `);

    await queryRunner.query(`
      INSERT INTO languages (name, slug, display_order) VALUES
      ('Inglés', 'ingles', 1),
      ('Español', 'espanol', 2),
      ('Japonés', 'japones', 3),
      ('Coreano', 'coreano', 4),
      ('Francés', 'frances', 5),
      ('Alemán', 'aleman', 6),
      ('Italiano', 'italiano', 7),
      ('Portugués', 'portugues', 8),
      ('Chino', 'chino', 9),
      ('Otro', 'otro', 10)
      ON CONFLICT (slug) DO UPDATE 
      SET name = EXCLUDED.name,
          display_order = EXCLUDED.display_order,
          updated_at = now();
    `);

    await queryRunner.query(`
      INSERT INTO subscriptionplans (id, name, price, duration_days, description, features, is_active, created_at, updated_at)
      VALUES
        (gen_random_uuid(), 'Free', 0.00, 3650, 'Plan gratuito por defecto', '{"maxSales": 10, "canCreateStore": false, "branding": false, "statistics": false, "featured": false, "support": "community"}', true, now(), now()),
        (gen_random_uuid(), 'Pro', 4.99, 30, 'Plan Pro para usuarios avanzados', '{"maxSales": 50, "canCreateStore": false, "branding": true, "statistics": true, "featured": true, "support": "priority"}', true, now(), now()),
        (gen_random_uuid(), 'Tienda', 9.99, 30, 'Plan para tiendas profesionales', '{"maxSales": 1000, "canCreateStore": true, "branding": true, "statistics": true, "featured": true, "support": "priority"}', true, now(), now());
    `);

    // 4. Insertar usuario admin y su suscripción al plan Free
    const passwordHash = await bcrypt.hash('Admin1234', 10);
    await queryRunner.query(`
      INSERT INTO users (id, name, email, password, role, is_store, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'Administrador',
        'admin@beyondtcg.cl',
        '${passwordHash}',
        'admin',
        false,
        now(),
        now()
      );
    `);

    // Obtener el id del usuario admin y del plan Free
    const adminUser = await queryRunner.query(
      `SELECT id FROM users WHERE email = 'admin@beyondtcg.cl' LIMIT 1;`,
    );
    const freePlan = await queryRunner.query(
      `SELECT id FROM subscriptionplans WHERE name = 'Free' LIMIT 1;`,
    );

    // Crear la suscripción del admin
    await queryRunner.query(`
      INSERT INTO usersubscriptions (id, user_id, plan_id, start_date, end_date, is_active, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        '${adminUser[0].id}',
        '${freePlan[0].id}',
        now(),
        now() + INTERVAL '3650 days',
        true,
        now(),
        now()
      );
    `);

    // Actualizar el usuario admin con la suscripción creada
    const adminSub = await queryRunner.query(
      `SELECT id FROM usersubscriptions WHERE user_id = '${adminUser[0].id}' AND plan_id = '${freePlan[0].id}' LIMIT 1;`,
    );
    await queryRunner.query(`
      UPDATE users SET current_subscription_id = '${adminSub[0].id}' WHERE id = '${adminUser[0].id}';
    `);

    // --- BADGES SYSTEM ---
    // Crear tabla Badges
    await queryRunner.query(`
      CREATE TABLE badges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('user', 'store')),
        category VARCHAR(20) NOT NULL CHECK (category IN ('level', 'reputation', 'plan', 'volume', 'quality', 'specialty')),
        icon_url VARCHAR(255) NOT NULL,
        criteria JSONB NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);
    // Crear tabla UserBadges
    await queryRunner.query(`
      CREATE TABLE userbadges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
        awarded_at TIMESTAMP DEFAULT now(),
        expires_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        UNIQUE(user_id, badge_id)
      )
    `);
    // Crear tabla StoreBadges
    await queryRunner.query(`
      CREATE TABLE storebadges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
        badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
        awarded_at TIMESTAMP DEFAULT now(),
        expires_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        UNIQUE(store_id, badge_id)
      )
    `);
    // Crear índices para badges
    await queryRunner.query(`CREATE INDEX idx_badges_type ON badges(type)`);
    await queryRunner.query(
      `CREATE INDEX idx_badges_category ON badges(category)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_badges_is_active ON badges(is_active)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_userbadges_user_id ON userbadges(user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_userbadges_badge_id ON userbadges(badge_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_userbadges_expires_at ON userbadges(expires_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_storebadges_store_id ON storebadges(store_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_storebadges_badge_id ON storebadges(badge_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_storebadges_expires_at ON storebadges(expires_at)`,
    );
    // Insertar datos iniciales de badges
    await queryRunner.query(`
      INSERT INTO badges (name, description, type, category, icon_url, criteria, is_active) VALUES
        ('welcome', '¡Bienvenido a bordo!', 'user', 'level',
         'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/user-plus.svg',
         '{"type": "register"}', true),
        ('upgrade_pro', '¡Has mejorado a Pro!', 'user', 'plan',
         'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/arrow-up.svg',
         '{"type": "subscription_upgrade", "plan": "Pro"}', true),
        ('upgrade_store', '¡Ahora eres dueño de una tienda!', 'user', 'plan',
         'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/store.svg',
         '{"type": "subscription_upgrade", "plan": "Store"}', true),
        ('rookie', 'Primeras ventas/compras completadas', 'user', 'level',
         'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/seedling.svg',
         '{"type": "transactions", "count": 5, "period": "all_time"}', true),
        ('experienced', 'Más de 50 transacciones completadas', 'user', 'level',
         'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/star.svg',
         '{"type": "transactions", "count": 50, "period": "all_time"}', true),
        ('expert', 'Más de 200 transacciones completadas', 'user', 'level',
         'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/crown.svg',
         '{"type": "transactions", "count": 200, "period": "all_time"}', true),
        ('trusted_seller', 'Rating promedio superior a 4.5', 'user', 'reputation',
         'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/shield-check.svg',
         '{"type": "rating", "min_average": 4.5, "min_ratings": 10}', true),
        ('fast_shipper', 'Envíos confirmados en menos de 48h', 'user', 'reputation',
         'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/truck-fast.svg',
         '{"type": "shipping_time", "max_hours": 48, "min_sales": 5}', true),
        ('pro_member', 'Usuario con plan Pro', 'user', 'plan',
         'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/gem.svg',
         '{"type": "subscription", "plan": "Pro"}', true),
        ('store_owner', 'Usuario con plan Tienda', 'user', 'plan',
         'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/store.svg',
         '{"type": "subscription", "plan": "Tienda"}', true),
        ('rising_store', 'Más de 100 ventas completadas', 'store', 'volume',
         'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/arrow-trend-up.svg',
         '{"type": "sales", "count": 100, "period": "all_time"}', true),
        ('popular_store', 'Más de 500 ventas completadas', 'store', 'volume',
         'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/fire.svg',
         '{"type": "sales", "count": 500, "period": "all_time"}', true),
        ('top_rated', 'Rating promedio superior a 4.8', 'store', 'quality',
         'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/trophy.svg',
         '{"type": "rating", "min_average": 4.8, "min_ratings": 20}', true),
        ('active_store', 'Más de 50 ventas activas', 'store', 'quality',
         'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/bolt.svg',
         '{"type": "active_sales", "count": 50}', true),
        ('pokemon_expert', 'Especialista en Pokémon', 'store', 'specialty',
         'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/pokeball.svg',
         '{"type": "category_sales", "category": "pokemon", "percentage": 70}', true),
        ('yugioh_expert', 'Especialista en Yu-Gi-Oh!', 'store', 'specialty',
         'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/wand-sparkles.svg',
         '{"type": "category_sales", "category": "yu-gi-oh", "percentage": 70}', true),
        ('magic_expert', 'Especialista en Magic', 'store', 'specialty',
         'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/wand-magic-sparkles.svg',
         '{"type": "category_sales", "category": "magic-the-gathering", "percentage": 70}', true)
      ON CONFLICT (name) DO UPDATE
      SET description = EXCLUDED.description,
          type = EXCLUDED.type,
          category = EXCLUDED.category,
          icon_url = EXCLUDED.icon_url,
          criteria = EXCLUDED.criteria,
          is_active = EXCLUDED.is_active,
          updated_at = now();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Aquí irían los DROP TABLE y DROP INDEX en orden inverso
    await queryRunner.query(`DROP INDEX IF EXISTS idx_storebadges_expires_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_storebadges_badge_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_storebadges_store_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_userbadges_expires_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_userbadges_badge_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_userbadges_user_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_badges_is_active`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_badges_category`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_badges_type`);
    await queryRunner.query(`DROP TABLE IF EXISTS storebadges`);
    await queryRunner.query(`DROP TABLE IF EXISTS userbadges`);
    await queryRunner.query(`DROP TABLE IF EXISTS badges`);
  }
}
