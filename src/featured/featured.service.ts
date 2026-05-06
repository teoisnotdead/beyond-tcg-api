import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../stores/entities/store.entity';
import { User } from '../users/entities/user.entity';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';

@Injectable()
export class FeaturedService {
  constructor(
    @InjectRepository(Store) private storesRepository: Repository<Store>,
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(SubscriptionPlan) private plansRepository: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription) private userSubscriptionsRepository: Repository<UserSubscription>,
    @InjectRepository(Sale) private salesRepository: Repository<Sale>,
  ) {}

  async getFeatured() {
    // Resolve plans by tier to avoid locale-specific plan names (e.g. "Store" vs "Tienda")
    const storePlan = await this.plansRepository.findOne({ where: { tier: 'store' } });
    if (!storePlan) { throw new Error('Store plan not found'); }
    const proPlan = await this.plansRepository.findOne({ where: { tier: 'pro' } });
    if (!proPlan) { throw new Error('Pro plan not found'); }

    // Get all active subscriptions (Store and Pro) using queryBuilder to filter by plan_id and is_active
    const storeSubs = await this.userSubscriptionsRepository.createQueryBuilder('sub')
      .where('sub.plan_id = :planId', { planId: storePlan.id })
      .andWhere('sub.is_active = true')
      .getMany();
    const proSubs = await this.userSubscriptionsRepository.createQueryBuilder('sub')
      .where('sub.plan_id = :planId', { planId: proPlan.id })
      .andWhere('sub.is_active = true')
      .getMany();

    // Get user_ids from Store and Pro subscriptions
    const storeUserIds = storeSubs.map(sub => sub.user_id);
    const proUserIds = proSubs.map(sub => sub.user_id);

    // Get all stores (related to user) that belong to users with Store plan
    const stores = storeUserIds.length
      ? await this.storesRepository.createQueryBuilder('store')
          .leftJoinAndSelect('store.user', 'user')
          .where('user.id IN (:...storeUserIds)', { storeUserIds })
          .getMany()
      : [];

    // Get all users (without store) with Pro plan using queryBuilder to filter by id in proUserIds and is_store = false
    const proUsers = proUserIds.length
      ? await this.usersRepository.createQueryBuilder('user')
          .where('user.id IN (:...proUserIds)', { proUserIds })
          .andWhere('user.is_store = false')
          .getMany()
      : [];

    // For each store, calculate totalViews (sum of views from its sales) and activeSales (sales with status = 'active')
    const featuredStores = await Promise.all(stores.map(async (store) => {
      const sales = await this.salesRepository.find({ where: { store_id: store.id } });
      const totalViews = sales.reduce((acc, s) => acc + (s.views || 0), 0);
      const activeSales = sales.filter(s => s.status === SaleStatus.AVAILABLE).length;
      return {
        id: store.id,
        name: store.name,
        avatar_url: store.avatar_url,
        banner_url: store.banner_url,
        description: store.description,
        totalViews,
        activeSales,
        type: 'store'
      };
    }));

    // For each Pro user, calculate totalViews (sum of views from their sales) and activeSales (sales with status = 'active')
    const featuredUsers = await Promise.all(proUsers.map(async (user) => {
      const sales = await this.salesRepository.find({ where: { seller: { id: user.id } } });
      const totalViews = sales.reduce((acc, s) => acc + (s.views || 0), 0);
      const activeSales = sales.filter(s => s.status === SaleStatus.AVAILABLE).length;
      return {
        id: user.id,
        name: user.name,
        avatar_url: user.avatar_url,
        totalViews,
        activeSales,
        type: 'user'
      };
    }));

    // Combine stores and users into a single array (first stores, then users)
    return [...featuredStores, ...featuredUsers];
  }
} 
