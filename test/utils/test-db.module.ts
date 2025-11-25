import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../src/users/entities/user.entity';
import { Category } from '../../src/categories/entities/category.entity';
import { Language } from '../../src/languages/entities/language.entity';
import { SubscriptionPlan } from '../../src/subscriptions/entities/subscription-plan.entity';
import { UserSubscription } from '../../src/subscriptions/entities/user-subscription.entity';
import { UserRating } from '../../src/ratings/entities/user-rating.entity';
import { StoreRating } from '../../src/ratings/entities/store-rating.entity';
import { Store } from '../../src/stores/entities/store.entity';
import { Sale } from '../../src/sales/entities/sale.entity';
import { StoreSocialLink } from '../../src/stores/entities/store-social-link.entity';
import { Favorite } from '../../src/favorites/entities/favorite.entity';
import { Notification } from '../../src/notifications/entities/notification.entity';
import { Comment } from '../../src/comments/entities/comment.entity';
import { CommentSubscription } from '../../src/comments/entities/comment-subscription.entity';

import { Purchase } from '../../src/purchases/entities/purchase.entity';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: '127.0.0.1',
            port: 5433,
            username: 'test_user',
            password: 'test_password',
            database: 'beyond_tcg_test',
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
                Purchase,
                StoreSocialLink,
                Favorite,
                Notification,
                Comment,
                CommentSubscription,
            ],
            synchronize: true, // Enable auto-sync for tests
            dropSchema: true, // Drop schema on connection
            migrationsRun: false, // Disable migrations
        }),
    ],
})
export class TestDbModule { }
