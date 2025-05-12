import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { User } from '../users/entities/user.entity';
import { Sale } from '../sales/entities/sale.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
  ) {}

  async addFavorite(userId: string, createFavoriteDto: CreateFavoriteDto): Promise<Favorite> {
    // Validar que no exista ya el favorito
    const exists = await this.favoriteRepository.findOne({
      where: {
        user: { id: userId },
        sale: { id: createFavoriteDto.sale_id },
      },
    });
    if (exists) {
      throw new BadRequestException('This sale is already in your favorites.');
    }

    const favorite = this.favoriteRepository.create({
      user: { id: userId } as User,
      sale: { id: createFavoriteDto.sale_id } as Sale,
    });
    return this.favoriteRepository.save(favorite);
  }

  async removeFavorite(userId: string, saleId: string): Promise<void> {
    await this.favoriteRepository.delete({
      user: { id: userId },
      sale: { id: saleId },
    });
  }

  async getUserFavorites(userId: string): Promise<Favorite[]> {
    return this.favoriteRepository.find({
      where: { user: { id: userId } },
      relations: ['sale'],
    });
  }
} 