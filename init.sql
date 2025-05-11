-- Active: 1746909768111@@127.0.0.1@5432@beyond_game_tcg


CREATE DATABASE beyond_game_tcg;
DROP TABLE IF EXISTS UserSubscriptions, SubscriptionPlans, Notifications, StoreSocialLinks, StoreRatings, Stores, Favorites, Purchases, Comments, Sales, Categories, Languages, Users;

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
    user_id UUID REFERENCES Users(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT now()
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
    store_id UUID REFERENCES Stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    status VARCHAR(20) DEFAULT 'available',
    views INTEGER DEFAULT 0,
    category_id UUID REFERENCES Categories(id) NOT NULL,
    language_id UUID REFERENCES Languages(id) NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE Comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES Sales(id) ON DELETE CASCADE,
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
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

CREATE TABLE Notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'comment', 'purchase', 'rating', 'system', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_entity_id UUID, -- ID de la entidad relacionada (sale_id, comment_id, etc.)
    related_entity_type VARCHAR(50), -- Tipo de entidad relacionada ('sale', 'comment', etc.)
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
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

-- Datos iniciales de categorías e idiomas (puedes copiar los que ya tienes)


INSERT INTO Categories (name, slug, description, display_order) VALUES
    ('Digimon', 'digimon', 'Cartas coleccionables del juego Digimon Card Game', 1),
    ('Dragon Ball Fusion', 'dragon-ball-fusion', 'Cartas del juego Dragon Ball Fusion World', 2),
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