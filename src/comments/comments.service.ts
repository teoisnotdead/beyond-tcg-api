import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
  ) {}

  async create(userId: string, createCommentDto: CreateCommentDto): Promise<Comment> {
    const comment = this.commentsRepository.create({
      ...createCommentDto,
      user: { id: userId },
      sale: createCommentDto.sale_id ? { id: createCommentDto.sale_id } : undefined,
      store: createCommentDto.store_id ? { id: createCommentDto.store_id } : undefined,
      targetUser: createCommentDto.target_user_id ? { id: createCommentDto.target_user_id } : undefined,
    });
    return this.commentsRepository.save(comment);
  }

  async findAllForSale(saleId: string): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { sale: { id: saleId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async findAllForStore(storeId: string): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { store: { id: storeId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async findAllForUser(userId: string): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { targetUser: { id: userId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }
}
