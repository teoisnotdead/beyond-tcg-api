import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { SubscriptionPlan } from 'src/subscriptions/entities/subscription-plan.entity';
import { UserSubscription } from 'src/subscriptions/entities/user-subscription.entity';
import { EnvConfig } from 'src/config/env.config';
import { Sale } from '../sales/entities/sale.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRegisteredEvent } from '../badges/badges.events';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(SubscriptionPlan)
    private subscriptionPlansRepository: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription)
    private userSubscriptionsRepository: Repository<UserSubscription>,
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
    @InjectRepository(Purchase)
    private purchasesRepository: Repository<Purchase>,
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({ where: { email: createUserDto.email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    const user = this.usersRepository.create(createUserDto);

    // Assign default avatar if not provided (for email/password registration)
    if (!user.avatar_url) {
      user.avatar_url = EnvConfig().cloudinary.defaultAvatarUrl;
    }

    if (createUserDto.password) {
      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(createUserDto.password, salt);
    }
    const savedUser = await this.usersRepository.save(user);

    // Logic for "Free" subscription
    const freePlan = await this.subscriptionPlansRepository.findOne({ where: { name: 'Free' } });
    if (freePlan) {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(now.getDate() + freePlan.duration_days);

      const userSubscription = await this.userSubscriptionsRepository.save({
        user_id: savedUser.id,
        plan_id: freePlan.id,
        start_date: now,
        end_date: endDate,
        is_active: true,
      });

      savedUser.current_subscription_id = userSubscription.id;
      await this.usersRepository.save(savedUser);
    }

    // Emit event for badge assignment
    this.eventEmitter.emit('user.registered', new UserRegisteredEvent(savedUser.id));

    return savedUser;
  }

  async findAll(page: number = 1, limit: number = 20, filters: Partial<User> = {}): Promise<{ data: User[]; total: number; page: number; totalPages: number }> {
    const [data, total] = await this.usersRepository.findAndCount({
      where: filters,
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<{ message: string }> {
    try {
      const result = await this.usersRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  async getStatistics(userId: string) {
    try {
      // Purchases and money spent
      const purchases = await this.purchasesRepository.find({ where: { user: { id: userId } } });
      const totalPurchases = purchases.length;
      const totalSpent = purchases.reduce((acc, p) => acc + Number(p.price) * p.quantity, 0);
      // Sales and money earned
      const sales = await this.salesRepository.find({ where: { seller: { id: userId } } });
      const totalSales = sales.filter(s => s.status === 'completed').length;
      const totalRevenue = sales.filter(s => s.status === 'completed').reduce((acc, s) => acc + Number(s.price) * s.quantity, 0);
      // Favorites given
      const favoritesGiven = await this.favoriteRepository.count({ where: { user: { id: userId } } });
      // Favorites received (in user's sales)
      const saleIds = sales.map(s => s.id);
      let favoritesReceived = 0;
      if (saleIds.length > 0) {
        favoritesReceived = await this.favoriteRepository.createQueryBuilder('favorite')
          .where('favorite.saleId IN (:...saleIds)', { saleIds })
          .getCount();
      }
      return {
        totalPurchases,
        totalSpent,
        totalSales,
        totalRevenue,
        favoritesGiven,
        favoritesReceived
      };
    } catch (error) {
      console.error('[USERS SERVICE] Error en getStatistics:', error);
      throw error;
    }
  }

  async searchUsers({ search, page = 1, limit = 20, offset, roles }: { search?: string; page?: number; limit?: number; offset?: number; roles?: string | string[] }) {
    try {
      let skip = 0;
      if (typeof offset !== 'undefined') {
        skip = Number(offset);
      } else {
        skip = (Number(page) - 1) * Number(limit);
      }
      let roleList: string[] | undefined = undefined;
      if (roles) {
        if (Array.isArray(roles)) {
          roleList = roles;
        } else {
          roleList = roles.split(',');
        }
      }
      const qb = this.usersRepository.createQueryBuilder('user');
      if (roleList && roleList.length > 0) {
        qb.andWhere('user.role IN (:...roleList)', { roleList });
      }
      if (search) {
        qb.andWhere(`(
          user.name ILIKE :search OR
          user.email ILIKE :search
        )`, { search: `%${search}%` });
      }
      qb.orderBy('user.created_at', 'DESC')
        .skip(skip)
        .take(Number(limit));
      const [users, total] = await qb.getManyAndCount();
      const result = {
        users,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: typeof offset !== 'undefined' ? Math.floor(skip / Number(limit)) + 1 : Number(page),
        total
      };
      return result;
    } catch (error) {
      console.error('[USERS SERVICE] Error en searchUsers:', error);
      throw error;
    }
  }
}