import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';
import { CommentsModule } from '../comments/comments.module';
import { UserRating } from '../ratings/entities/user-rating.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      SubscriptionPlan,
      UserSubscription,
      UserRating
    ]),
    CommentsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
