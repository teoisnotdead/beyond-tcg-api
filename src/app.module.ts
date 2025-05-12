import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { LanguagesModule } from './languages/languages.module';
import { User } from './users/entities/user.entity';
import { Category } from './categories/entities/category.entity';
import { Language } from './languages/entities/language.entity';
import { EnvConfig } from './config/env.config';
import { SubscriptionPlan } from './subscriptions/entities/subscription-plan.entity';
import { UserSubscription } from './subscriptions/entities/user-subscription.entity';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { StoreRating } from './ratings/entities/store-rating.entity';
import { UserRating } from './ratings/entities/user-rating.entity';
import { Sale } from './sales/entities/sale.entity';
import { Store } from './stores/entities/store.entity';
import { StoreSocialLink } from './stores/entities/store-social-link.entity';
import { Favorite } from './favorites/entities/favorite.entity';
import { FavoritesModule } from './favorites/favorites.module';
import { SalesModule } from './sales/sales.module';
import { PurchasesModule } from './purchases/purchases.module';
import { RatingsModule } from './ratings/ratings.module';
import { CommentsModule } from './comments/comments.module';
import { StoresModule } from './stores/stores.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [EnvConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        entities: [
          User,
          Category,
          Language,
          SubscriptionPlan,
          UserSubscription,
          UserRating,
          StoreRating,
          Store,
          Sale,
          StoreSocialLink,
          Favorite,
        ],
        synchronize: configService.get('environment') !== 'production',
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    CategoriesModule,
    LanguagesModule,
    SubscriptionsModule,
    CloudinaryModule,
    FavoritesModule,
    SalesModule,
    StoresModule,
    PurchasesModule,
    RatingsModule,
    CommentsModule
  ],
})
export class AppModule {}