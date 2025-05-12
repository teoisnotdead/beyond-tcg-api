import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRating } from './entities/user-rating.entity';
import { StoreRating } from './entities/store-rating.entity';
import { CreateUserRatingDto } from './dto/create-user-rating.dto';
import { CreateStoreRatingDto } from './dto/create-store-rating.dto';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(UserRating)
    private userRatingRepository: Repository<UserRating>,
    @InjectRepository(StoreRating)
    private storeRatingRepository: Repository<StoreRating>,
  ) {}

  async createUserRating(createUserRatingDto: CreateUserRatingDto, raterId: string): Promise<UserRating> {
    const userRating = this.userRatingRepository.create({
      user: { id: createUserRatingDto.user_id },
      rater: { id: raterId },
      rating: createUserRatingDto.rating,
      comment: createUserRatingDto.comment,
    });
    return this.userRatingRepository.save(userRating);
  }

  async createStoreRating(createStoreRatingDto: CreateStoreRatingDto, raterId: string): Promise<StoreRating> {
    const storeRating = this.storeRatingRepository.create({
      store: { id: createStoreRatingDto.store_id },
      rater: { id: raterId },
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
}
