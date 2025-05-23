import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
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
import { NotificationsModule } from './notifications/notifications.module';
import { Notification } from './notifications/entities/notification.entity';
import { FeaturedModule } from './featured/featured.module';
import { HeadersModule } from './common/headers/headers.module';
import { APP_FILTER } from '@nestjs/core';
import { GlobalHttpExceptionFilter } from './common/http-exception.filter';
import { Comment } from './comments/entities/comment.entity';
import { CommentSubscription } from './comments/entities/comment-subscription.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [EnvConfig],
    }),
    EventEmitterModule.forRoot(),
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
          Notification,
          Comment,
          CommentSubscription,
        ],
        synchronize: false,
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
    CommentsModule,
    NotificationsModule,
    FeaturedModule,
    HeadersModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalHttpExceptionFilter },
  ],
})
export class AppModule {}