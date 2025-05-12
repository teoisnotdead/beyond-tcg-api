import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoreSocialLink } from './entities/store-social-link.entity';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
    @InjectRepository(StoreSocialLink)
    private socialLinksRepository: Repository<StoreSocialLink>,
  ) {}

  async create(userId: string, createStoreDto: CreateStoreDto): Promise<Store> {
    // Check if the user already has a store
    const existing = await this.storesRepository.findOne({ where: { user: { id: userId } } });
    if (existing) {
      throw new BadRequestException('The user already has a store');
    }

    // Create the store
    const store = this.storesRepository.create({
      ...createStoreDto,
      user: { id: userId },
    });

    // If there are socialLinks, create the entities and associate them
    if (createStoreDto.socialLinks && createStoreDto.socialLinks.length > 0) {
      store.socialLinks = createStoreDto.socialLinks.map(link =>
        this.socialLinksRepository.create(link)
      );
    }

    return this.storesRepository.save(store);
  }

  async findAll(): Promise<Store[]> {
    return this.storesRepository.find({ relations: ['user', 'socialLinks'] });
  }

  async findOne(id: string): Promise<Store> {
    const store = await this.storesRepository.findOne({
      where: { id },
      relations: ['user', 'socialLinks'],
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }
}
