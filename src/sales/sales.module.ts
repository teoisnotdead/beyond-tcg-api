import { forwardRef, Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PurchasesModule } from '../purchases/purchases.module';
import { CommentsModule } from '../comments/comments.module';
import { UsersModule } from '../users/users.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { SalesStateService } from './services/sales-state.service';
import { SalesHistoryService } from './services/sales-history.service';
import { Category } from '../categories/entities/category.entity';
import { Language } from '../languages/entities/language.entity';
import { SalesTransitionRulesService } from './services/sales-transition-rules.service';
import { SalesTransitionMiddleware } from './middleware/sales-transition.middleware';
import { StoresModule } from '../stores/stores.module';
import { CategoriesModule } from '../categories/categories.module';
import { LanguagesModule } from '../languages/languages.module';
import { SalesMetricsService } from './services/sales-metrics.service';
import { SalesReportService } from './services/sales-report.service';
import { SalesAnalysisService } from './services/sales-analysis.service';
import { SalesStatisticsService } from './services/sales-statistics.service';
import { SalesStatisticsController } from './controllers/sales-statistics.controller';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale,
      Purchase,
      User,
      Store,
      UserSubscription,
      SubscriptionPlan
    ]),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => PurchasesModule),
    forwardRef(() => UsersModule),
    forwardRef(() => StoresModule),
    CommentsModule,
    CloudinaryModule,
    CategoriesModule,
    LanguagesModule,
    NotificationsModule,
  ],
  providers: [
    SalesService,
    SalesStateService,
    SalesHistoryService,
    SalesMetricsService,
    SalesReportService,
    SalesAnalysisService,
    SalesStatisticsService,
    SalesTransitionRulesService
  ],
  controllers: [
    SalesController,
    SalesStatisticsController
  ],
  exports: [
    SalesService,
    SalesStateService,
    SalesHistoryService,
    SalesMetricsService,
    SalesReportService,
    SalesAnalysisService,
    SalesStatisticsService,
    SalesTransitionRulesService
  ],
})
export class SalesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SalesTransitionMiddleware)
      .forRoutes('sales/:saleId/status');
  }
}
