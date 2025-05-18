import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { StoreBadge } from './entities/store-badge.entity';
import { BadgesService } from './badges.service';
import { BadgesController } from './badges.controller';
import { BadgesListener } from './badges.listener';

@Module({
  imports: [TypeOrmModule.forFeature([Badge, UserBadge, StoreBadge]), EventEmitterModule.forRoot()],
  providers: [BadgesService, BadgesListener],
  controllers: [BadgesController],
  exports: [BadgesService],
})
export class BadgesModule {} 