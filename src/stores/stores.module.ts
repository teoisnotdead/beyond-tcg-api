import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './entities/store.entity';
import { StoreSocialLink } from './entities/store-social-link.entity';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CommentsModule } from '../comments/comments.module';
import { StoreRating } from '../ratings/entities/store-rating.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { SalesModule } from '../sales/sales.module';
import { FavoritesModule } from '../favorites/favorites.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Store, StoreSocialLink, StoreRating, Sale, Favorite]),
    SubscriptionsModule,
    CommentsModule,
    forwardRef(() => SalesModule),
    FavoritesModule,
    CloudinaryModule,
  ],
  providers: [StoresService],
  controllers: [StoresController],
  exports: [StoresService],
})
export class StoresModule {}
