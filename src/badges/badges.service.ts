import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { StoreBadge } from './entities/store-badge.entity';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';

@Injectable()
export class BadgesService {
  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepository: Repository<UserBadge>,
    @InjectRepository(StoreBadge)
    private readonly storeBadgeRepository: Repository<StoreBadge>,
  ) {}

  async findAllBadges(): Promise<Badge[]> {
    return this.badgeRepository.find({ where: { isActive: true } });
  }

  async findUserBadges(userId: string): Promise<UserBadge[]> {
    return this.userBadgeRepository.find({
      where: { user: { id: userId } },
      relations: ['badge'],
    });
  }

  async findStoreBadges(storeId: string): Promise<StoreBadge[]> {
    return this.storeBadgeRepository.find({
      where: { store: { id: storeId } },
      relations: ['badge'],
    });
  }

  async assignBadgeToUser(userId: string, badgeId: string, metadata?: any): Promise<UserBadge> {
    // Verifica si ya tiene el badge
    const existing = await this.userBadgeRepository.findOne({
      where: { user: { id: userId }, badge: { id: badgeId } },
      relations: ['user', 'badge'],
    });
    if (existing) return existing;
    const userBadge = this.userBadgeRepository.create({
      user: { id: userId } as any,
      badge: { id: badgeId } as any,
      metadata,
    });
    return this.userBadgeRepository.save(userBadge);
  }

  async assignBadgeToStore(storeId: string, badgeId: string, metadata?: any): Promise<StoreBadge> {
    const existing = await this.storeBadgeRepository.findOne({
      where: { store: { id: storeId }, badge: { id: badgeId } },
      relations: ['store', 'badge'],
    });
    if (existing) return existing;
    const storeBadge = this.storeBadgeRepository.create({
      store: { id: storeId } as any,
      badge: { id: badgeId } as any,
      metadata,
    });
    return this.storeBadgeRepository.save(storeBadge);
  }

  async removeBadgeFromUser(userId: string, badgeId: string): Promise<void> {
    await this.userBadgeRepository.delete({ user: { id: userId }, badge: { id: badgeId } });
  }

  async removeBadgeFromStore(storeId: string, badgeId: string): Promise<void> {
    await this.storeBadgeRepository.delete({ store: { id: storeId }, badge: { id: badgeId } });
  }

  async createBadge(dto: CreateBadgeDto): Promise<Badge> {
    const badge = this.badgeRepository.create(dto);
    return this.badgeRepository.save(badge);
  }

  async updateBadge(id: string, dto: UpdateBadgeDto): Promise<Badge> {
    await this.badgeRepository.update(id, dto);
    return this.badgeRepository.findOneBy({ id });
  }
} 