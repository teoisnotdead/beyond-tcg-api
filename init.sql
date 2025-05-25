-- Active: 1746909768111@@127.0.0.1@5432@beyond_game_tcg


CREATE DATABASE beyond_game_tcg;
DROP TABLE IF EXISTS UserSubscriptions, SubscriptionPlans, Notifications, StoreSocialLinks, StoreRatings, UserRatings, Stores, Favorites, Purchases, Comments, Sales, SalesCancelled, Categories, Languages, Users;

CREATE TABLE Users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),  -- Opcional para permitir login con Google
    role VARCHAR(20) DEFAULT 'user', -- admin, mod, user, store
    is_store BOOLEAN DEFAULT false,
    google_id VARCHAR(255),  -- ID único de Google
    avatar_url VARCHAR(255), -- URL de la imagen de perfil
    current_subscription_id UUID,  -- Se actualizará después con FOREIGN KEY
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    refresh_token TEXT,
    refresh_token_expires_at TIMESTAMP
);

CREATE TABLE SubscriptionPlans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE, -- 'Free', 'Premium'.
    price DECIMAL(10, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    description TEXT,
    features JSONB, -- Características del plan en formato JSON
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE UserSubscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES SubscriptionPlans(id) ON DELETE RESTRICT,
    start_date TIMESTAMP NOT NULL DEFAULT now(),
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    payment_id VARCHAR(255), -- ID de referencia del pago (Stripe, PayPal, etc.)
    auto_renew BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Ahora que UserSubscriptions existe, podemos actualizar la referencia en Users
ALTER TABLE Users ADD CONSTRAINT fk_users_subscription 
    FOREIGN KEY (current_subscription_id) REFERENCES UserSubscriptions(id) ON DELETE SET NULL;

CREATE TABLE Stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES Users(id) UNIQUE,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    banner_url VARCHAR(255),
    description TEXT,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE StoreSocialLinks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES Stores(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- facebook, twitter, instagram, email, etc.
    url VARCHAR(255) NOT NULL
);

CREATE TABLE StoreRatings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES Stores(id) ON DELETE CASCADE,
    rater_id UUID REFERENCES Users(id) ON DELETE SET NULL,
    sale_id UUID REFERENCES Sales(id) ON DELETE CASCADE, -- Venta asociada
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE (sale_id, rater_id)
);

CREATE TABLE UserRatings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE, -- Usuario que recibe el rating
    rater_id UUID REFERENCES Users(id) ON DELETE SET NULL, -- Usuario que da el rating
    sale_id UUID REFERENCES Sales(id) ON DELETE CASCADE, -- Venta asociada
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE (sale_id, rater_id) -- Un rating por venta y usuario calificador
);

CREATE TABLE Categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE Languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE Sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES Users(id) ON DELETE SET NULL,
    store_id UUID REFERENCES Stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    original_quantity INTEGER NOT NULL CHECK (original_quantity >= quantity),
    parent_sale_id UUID REFERENCES Sales(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'shipped', 'delivered', 'completed', 'cancelled')),
    views INTEGER DEFAULT 0,
    category_id UUID REFERENCES Categories(id) NOT NULL,
    language_id UUID REFERENCES Languages(id) NOT NULL,
    shipping_proof_url VARCHAR(255),
    delivery_proof_url VARCHAR(255),
    reserved_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE SalesCancelled (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_sale_id UUID REFERENCES Sales(id) ON DELETE SET NULL,
    parent_sale_id UUID REFERENCES Sales(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES Users(id) ON DELETE SET NULL,
    store_id UUID REFERENCES Stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    original_quantity INTEGER NOT NULL CHECK (original_quantity >= quantity),
    category_id UUID REFERENCES Categories(id) NOT NULL,
    language_id UUID REFERENCES Languages(id) NOT NULL,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP NOT NULL DEFAULT now(),
    created_at TIMESTAMP NOT NULL,
    original_status VARCHAR(20) NOT NULL
);

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

CREATE TABLE Purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES Sales(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    language_id UUID REFERENCES Languages(id) NOT NULL,
    category_id UUID REFERENCES Categories(id) NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE Favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES Sales(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE(user_id, sale_id)
);

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

-- Tablas de Badges
CREATE TABLE Badges (
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
);

CREATE TABLE UserBadges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES Badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP DEFAULT now(),
    expires_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE(user_id, badge_id)
);

CREATE TABLE StoreBadges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES Stores(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES Badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP DEFAULT now(),
    expires_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE(store_id, badge_id)
);

-- Índices útiles
CREATE INDEX idx_categories_slug ON Categories(slug);
CREATE INDEX idx_categories_display_order ON Categories(display_order);
CREATE INDEX idx_languages_slug ON Languages(slug);
CREATE INDEX idx_languages_display_order ON Languages(display_order);
CREATE INDEX idx_notifications_user_id ON Notifications(user_id);
CREATE INDEX idx_notifications_is_read ON Notifications(is_read);
CREATE INDEX idx_notifications_created_at ON Notifications(created_at);
CREATE INDEX idx_usersubscriptions_user_id ON UserSubscriptions(user_id);
CREATE INDEX idx_usersubscriptions_end_date ON UserSubscriptions(end_date);
CREATE INDEX idx_usersubscriptions_is_active ON UserSubscriptions(is_active);

-- Índices para Badges
CREATE INDEX idx_badges_type ON Badges(type);
CREATE INDEX idx_badges_category ON Badges(category);
CREATE INDEX idx_badges_is_active ON Badges(is_active);
CREATE INDEX idx_userbadges_user_id ON UserBadges(user_id);
CREATE INDEX idx_userbadges_badge_id ON UserBadges(badge_id);
CREATE INDEX idx_userbadges_expires_at ON UserBadges(expires_at);
CREATE INDEX idx_storebadges_store_id ON StoreBadges(store_id);
CREATE INDEX idx_storebadges_badge_id ON StoreBadges(badge_id);
CREATE INDEX idx_storebadges_expires_at ON StoreBadges(expires_at);

-- Índices adicionales para SalesCancelled
CREATE INDEX idx_sales_cancelled_seller_id ON SalesCancelled(seller_id);
CREATE INDEX idx_sales_cancelled_store_id ON SalesCancelled(store_id);
CREATE INDEX idx_sales_cancelled_cancelled_at ON SalesCancelled(cancelled_at);
CREATE INDEX idx_sales_parent_sale_id ON Sales(parent_sale_id);
CREATE INDEX idx_sales_cancelled_parent_sale_id ON SalesCancelled(parent_sale_id);

-- Datos iniciales de categorías e idiomas (puedes copiar los que ya tienes)


INSERT INTO Categories (name, slug, description, display_order) VALUES
    ('Digimon', 'digimon', 'Cartas coleccionables del juego Digimon Card Game', 1),
    ('Dragon Ball Fusion World', 'dragon-ball-fusion.world', 'Cartas del juego Dragon Ball Fusion World', 2),
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

-- Datos iniciales de idiomas
INSERT INTO Languages (name, slug, display_order) VALUES
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


INSERT INTO SubscriptionPlans (id, name, price, duration_days, description, features, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Free', 0.00, 3650, 'Plan gratuito por defecto', '{"maxSales": 10, "canCreateStore": false, "branding": false, "statistics": false, "featured": false, "support": "community"}', true, now(), now()),
  (gen_random_uuid(), 'Pro', 4.99, 30, 'Plan Pro para usuarios avanzados', '{"maxSales": 50, "canCreateStore": false, "branding": true, "statistics": true, "featured": true, "support": "priority"}', true, now(), now()),
  (gen_random_uuid(), 'Tienda', 9.99, 30, 'Plan para tiendas profesionales', '{"maxSales": 1000, "canCreateStore": true, "branding": true, "statistics": true, "featured": true, "support": "priority"}', true, now(), now());

-- Datos iniciales de Badges
-- Usando placeholders de iconos de FontAwesome (gratuitos y ampliamente usados)
INSERT INTO Badges (name, description, type, category, icon_url, criteria, is_active) VALUES
    -- Badges de Nivel para Usuarios
    ('rookie', 'Primeras ventas/compras completadas', 'user', 'level', 
     'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/seedling.svg',
     '{"type": "transactions", "count": 5, "period": "all_time"}', true),
    
    ('experienced', 'Más de 50 transacciones completadas', 'user', 'level',
     'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/star.svg',
     '{"type": "transactions", "count": 50, "period": "all_time"}', true),
    
    ('expert', 'Más de 200 transacciones completadas', 'user', 'level',
     'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/crown.svg',
     '{"type": "transactions", "count": 200, "period": "all_time"}', true),
    
    -- Badges de Reputación para Usuarios
    ('trusted_seller', 'Rating promedio superior a 4.5', 'user', 'reputation',
     'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/shield-check.svg',
     '{"type": "rating", "min_average": 4.5, "min_ratings": 10}', true),
    
    ('fast_shipper', 'Envíos confirmados en menos de 48h', 'user', 'reputation',
     'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/truck-fast.svg',
     '{"type": "shipping_time", "max_hours": 48, "min_sales": 5}', true),
    
    -- Badges de Plan para Usuarios
    ('pro_member', 'Usuario con plan Pro', 'user', 'plan',
     'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/gem.svg',
     '{"type": "subscription", "plan": "Pro"}', true),
    
    ('store_owner', 'Usuario con plan Tienda', 'user', 'plan',
     'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/store.svg',
     '{"type": "subscription", "plan": "Tienda"}', true),
    
    -- Badges de Volumen para Tiendas
    ('rising_store', 'Más de 100 ventas completadas', 'store', 'volume',
     'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/arrow-trend-up.svg',
     '{"type": "sales", "count": 100, "period": "all_time"}', true),
    
    ('popular_store', 'Más de 500 ventas completadas', 'store', 'volume',
     'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/fire.svg',
     '{"type": "sales", "count": 500, "period": "all_time"}', true),
    
    -- Badges de Calidad para Tiendas
    ('top_rated', 'Rating promedio superior a 4.8', 'store', 'quality',
     'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/trophy.svg',
     '{"type": "rating", "min_average": 4.8, "min_ratings": 20}', true),
    
    ('active_store', 'Más de 50 ventas activas', 'store', 'quality',
     'https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/svgs/solid/bolt.svg',
     '{"type": "active_sales", "count": 50}', true),
    
    -- Badges de Especialidad para Tiendas
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