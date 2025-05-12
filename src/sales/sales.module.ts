import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PurchasesModule } from '../purchases/purchases.module';
import { CommentsModule } from '../comments/comments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale]),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => PurchasesModule),
    CommentsModule,
  ],
  providers: [SalesService],
  controllers: [SalesController],
  exports: [SalesService],
})
export class SalesModule {}
