import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { SubscriptionPlan } from 'src/subscriptions/entities/subscription-plan.entity';
import { UserSubscription } from 'src/subscriptions/entities/user-subscription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      SubscriptionPlan,
      UserSubscription
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
