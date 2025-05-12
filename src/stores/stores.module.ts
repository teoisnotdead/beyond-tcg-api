import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './entities/store.entity';
import { StoreSocialLink } from './entities/store-social-link.entity';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CommentsModule } from '../comments/comments.module';
import { StoreRating } from '../ratings/entities/store-rating.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Store, StoreSocialLink, StoreRating]), SubscriptionsModule, CommentsModule],
  providers: [StoresService],
  controllers: [StoresController],
  exports: [StoresService],
})
export class StoresModule {}
