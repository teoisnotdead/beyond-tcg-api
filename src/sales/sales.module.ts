import { forwardRef, Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PurchasesModule } from '../purchases/purchases.module';
import { CommentsModule } from '../comments/comments.module';
import { UsersModule } from '../users/users.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { SalesStateService } from './sales-state.service';
import { SalesHistoryService } from './sales-history.service';
import { Category } from '../categories/entities/category.entity';
import { Language } from '../languages/entities/language.entity';
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { SalesTransitionRulesService } from './services/sales-transition-rules.service';
import { SalesTransitionMiddleware } from './middleware/sales-transition.middleware';
import { StoresModule } from '../stores/stores.module';
import { CategoriesModule } from '../categories/categories.module';
import { LanguagesModule } from '../languages/languages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale,
      Purchase,
      Category,
      Language,
      User,
      Store,
    ]),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => PurchasesModule),
    forwardRef(() => UsersModule),
    forwardRef(() => StoresModule),
    CommentsModule,
    CloudinaryModule,
    CategoriesModule,
    LanguagesModule,
  ],
  providers: [
    SalesService,
    SalesStateService,
    SalesHistoryService,
    SalesTransitionRulesService,
  ],
  controllers: [SalesController],
  exports: [SalesService, SalesStateService, SalesHistoryService],
})
export class SalesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SalesTransitionMiddleware)
      .forRoutes('sales/:saleId/status');
  }
}
