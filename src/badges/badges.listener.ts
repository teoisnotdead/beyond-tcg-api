import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BadgesService } from './badges.service';
import { UserRegisteredEvent, UserSubscriptionChangedEvent } from './badges.events';

@Injectable()
export class BadgesListener {
  constructor(private readonly badgesService: BadgesService) {}

  @OnEvent('user.registered')
  async handleUserRegistered(event: UserRegisteredEvent) {
    // Assign the "welcome" badge
    await this.badgesService.assignBadgeToUser(event.userId, 'welcome');
  }

  @OnEvent('user.subscriptionChanged')
  async handleUserSubscriptionChanged(event: UserSubscriptionChangedEvent) {
    if (event.newPlan === 'Pro') {
      await this.badgesService.assignBadgeToUser(event.userId, 'upgrade_pro');
    } else if (event.newPlan === 'Store' || event.newPlan === 'Tienda') {
      await this.badgesService.assignBadgeToUser(event.userId, 'upgrade_store');
    }
  }
} 