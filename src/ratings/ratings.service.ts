import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRating } from './entities/user-rating.entity';
import { StoreRating } from './entities/store-rating.entity';
import { CreateUserRatingDto } from './dto/create-user-rating.dto';
import { CreateStoreRatingDto } from './dto/create-store-rating.dto';
import { Sale } from '../sales/entities/sale.entity';
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(UserRating)
    private userRatingRepository: Repository<UserRating>,
    @InjectRepository(StoreRating)
    private storeRatingRepository: Repository<StoreRating>,
  ) {}

  async createUserRating(createUserRatingDto: CreateUserRatingDto, raterId: string): Promise<UserRating> {
    // Validar que el usuario no se califique a sí mismo
    if (createUserRatingDto.user_id === raterId) {
      throw new BadRequestException('No puedes calificarte a ti mismo.');
    }

    // Validar que no exista ya un rating para esta venta y este usuario
    const exists = await this.userRatingRepository
      .createQueryBuilder('rating')
      .where('rating.userId = :userId', { userId: createUserRatingDto.user_id })
      .andWhere('rating.raterId = :raterId', { raterId })
      .andWhere('rating.saleId = :saleId', { saleId: createUserRatingDto.sale_id })
      .getOne();

    if (exists) {
      throw new BadRequestException('Ya has calificado esta venta.');
    }

    // Asociar correctamente la venta
    const userRating = this.userRatingRepository.create({
      user: { id: createUserRatingDto.user_id },
      rater: { id: raterId },
      sale: { id: createUserRatingDto.sale_id },
      rating: createUserRatingDto.rating,
      comment: createUserRatingDto.comment,
    });
    return this.userRatingRepository.save(userRating);
  }

  async createStoreRating(createStoreRatingDto: CreateStoreRatingDto, raterId: string): Promise<StoreRating> {
    // Validar que no exista ya un rating para esta venta y este usuario
    const exists = await this.storeRatingRepository
      .createQueryBuilder('rating')
      .where('rating.storeId = :storeId', { storeId: createStoreRatingDto.store_id })
      .andWhere('rating.raterId = :raterId', { raterId })
      .andWhere('rating.saleId = :saleId', { saleId: createStoreRatingDto.sale_id })
      .getOne();

    if (exists) {
      throw new BadRequestException('Ya has calificado esta venta para esta tienda.');
    }

    const storeRating = this.storeRatingRepository.create({
      store: { id: createStoreRatingDto.store_id } as Store,
      rater: { id: raterId } as User,
      sale: { id: createStoreRatingDto.sale_id } as Sale,
      rating: createStoreRatingDto.rating,
      comment: createStoreRatingDto.comment,
    });
    return this.storeRatingRepository.save(storeRating);
  }

  // Métodos para consultar ratings (por ejemplo, obtener todos los ratings de un usuario o tienda)
  async getUserRatings(userId: string): Promise<UserRating[]> {
    return this.userRatingRepository.find({ where: { user: { id: userId } } });
  }

  async getStoreRatings(storeId: string): Promise<StoreRating[]> {
    return this.storeRatingRepository.find({ where: { store: { id: storeId } } });
  }

  // Obtener promedio de ratings de usuario
  async getUserAverageRating(userId: string): Promise<number> {
    const result = await this.userRatingRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.rating)', 'avg')
      .where('rating.userId = :userId', { userId })
      .getRawOne();
    return parseFloat(result.avg) || 0;
  }

  // Obtener promedio de ratings de tienda
  async getStoreAverageRating(storeId: string): Promise<number> {
    const result = await this.storeRatingRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.rating)', 'avg')
      .where('rating.storeId = :storeId', { storeId })
      .getRawOne();
    return parseFloat(result.avg) || 0;
  }
}
