import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';
import { CommentsModule } from '../comments/comments.module';
import { UserRating } from '../ratings/entities/user-rating.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { SalesModule } from '../sales/sales.module';
import { PurchasesModule } from '../purchases/purchases.module';
import { FavoritesModule } from '../favorites/favorites.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      SubscriptionPlan,
      UserSubscription,
      UserRating,
      Sale,
      Purchase,
      Favorite
    ]),
    CommentsModule,
    forwardRef(() => SalesModule),
    forwardRef(() => PurchasesModule),
    forwardRef(() => FavoritesModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => AuthModule)
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
