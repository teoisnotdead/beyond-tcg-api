import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { User } from '../users/entities/user.entity';
import { Sale } from '../sales/entities/sale.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, createFavoriteDto: CreateFavoriteDto): Promise<Favorite> {
    const favorite = this.favoritesRepository.create({
      user: { id: userId },
      sale: { id: createFavoriteDto.sale_id }
    });

    const savedFavorite = await this.favoritesRepository.save(favorite);

    // Obtener el vendedor de la venta
    const sale = await this.favoritesRepository
      .createQueryBuilder('favorite')
      .leftJoinAndSelect('favorite.sale', 'sale')
      .leftJoinAndSelect('sale.seller', 'seller')
      .where('favorite.id = :id', { id: savedFavorite.id })
      .getOne();

    if (sale?.sale?.seller?.id) {
      // Notificar al vendedor
      await this.notificationsService.create({
        user_id: sale.sale.seller.id,
        type: NotificationType.FAVORITE_ADDED,
        title: 'Nueva venta favorita',
        message: 'Alguien ha marcado tu venta como favorita',
        metadata: {
          favorite_id: savedFavorite.id,
          sale_id: createFavoriteDto.sale_id,
          user_id: userId
        }
      });
    }

    return savedFavorite;
  }

  async removeFavorite(userId: string, saleId: string): Promise<void> {
    await this.favoritesRepository.delete({
      user: { id: userId },
      sale: { id: saleId },
    });
  }

  async getUserFavorites(userId: string): Promise<Favorite[]> {
    return this.favoritesRepository.find({
      where: { user: { id: userId } },
      relations: ['sale'],
    });
  }
} 