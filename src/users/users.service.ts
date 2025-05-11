import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { SubscriptionPlan } from 'src/subscriptions/entities/subscription-plan.entity';
import { UserSubscription } from 'src/subscriptions/entities/user-subscription.entity';

const DEFAULT_AVATAR_URL = 'https://res.cloudinary.com/teoisnotdead/image/upload/v1746931076/Beyond%20TCG/avatars/default_avatar.png';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(SubscriptionPlan)
    private subscriptionPlansRepository: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription)
    private userSubscriptionsRepository: Repository<UserSubscription>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({ where: { email: createUserDto.email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    const user = this.usersRepository.create(createUserDto);

    // Assign default avatar if not provided (for email/password registration)
    if (!user.avatar_url) {
      user.avatar_url = DEFAULT_AVATAR_URL;
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

    return savedUser;
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
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

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}