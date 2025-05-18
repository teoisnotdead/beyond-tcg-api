import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { UsersService } from '../users/users.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserSubscriptionChangedEvent } from '../badges/badges.events';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private subscriptionPlansRepository: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription)
    private userSubscriptionsRepository: Repository<UserSubscription>,
    private usersService: UsersService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getCurrentSubscription(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user.current_subscription_id) {
      throw new NotFoundException('User has no active subscription');
    }
    const subscription = await this.userSubscriptionsRepository.findOne({
      where: { id: user.current_subscription_id },
      relations: ['plan_id'],
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return subscription;
  }

  async upgradeSubscription(userId: string, planId: string) {
    const user = await this.usersService.findOne(userId);
    const plan = await this.subscriptionPlansRepository.findOne({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    if (!plan.is_active) {
      throw new BadRequestException('This plan is not currently available');
    }

    // Deactivate current subscription if exists
    if (user.current_subscription_id) {
      const currentSubscription = await this.userSubscriptionsRepository.findOne({
        where: { id: user.current_subscription_id },
      });
      if (currentSubscription) {
        currentSubscription.is_active = false;
        await this.userSubscriptionsRepository.save(currentSubscription);
      }
    }

    // Create new subscription
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + plan.duration_days);

    const newSubscription = await this.userSubscriptionsRepository.save({
      user_id: userId,
      plan_id: planId,
      start_date: now,
      end_date: endDate,
      is_active: true,
    });

    // Update user with new subscription
    user.current_subscription_id = newSubscription.id;
    await this.usersService.update(userId, { current_subscription_id: newSubscription.id });

    // Emit event for badge assignment
    this.eventEmitter.emit('user.subscriptionChanged', new UserSubscriptionChangedEvent(userId, plan.name));

    return newSubscription;
  }

  async getAllPlans() {
    return this.subscriptionPlansRepository.find({
      where: { is_active: true },
    });
  }

  async getPlanById(id: string) {
    const plan = await this.subscriptionPlansRepository.findOne({
      where: { id },
    });
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }
    return plan;
  }
} 