import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service'
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { UsersModule } from '../users/users.module';
import { SubscriptionValidationService } from './subscription-validation.service';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionPlan, UserSubscription]),
    UsersModule,
    forwardRef(() => SalesModule),
  ],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    SubscriptionValidationService,
  ],
  exports: [
    SubscriptionsService,
    SubscriptionValidationService,
  ],
})
export class SubscriptionsModule {} 