import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PurchasesModule } from '../purchases/purchases.module';
import { CommentsModule } from '../comments/comments.module';
import { UsersModule } from '../users/users.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { SalesStateService } from './sales-state.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale]),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => PurchasesModule),
    forwardRef(() => UsersModule),
    CommentsModule,
    CloudinaryModule,
  ],
  providers: [
    SalesService,
    SalesStateService,
  ],
  controllers: [SalesController],
  exports: [SalesService, SalesStateService],
})
export class SalesModule {}
