import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CommentSubscription } from './entities/comment-subscription.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

type PublicComment = {
  id: string;
  rating?: number | null;
  content: string;
  created_at: Date;
  user: {
    id: string;
    name: string;
    is_store: boolean;
    avatar_url?: string | null;
  };
};

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(CommentSubscription)
    private subscriptionRepository: Repository<CommentSubscription>,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, createCommentDto: CreateCommentDto): Promise<Comment> {
    const comment = this.commentsRepository.create({
      ...createCommentDto,
      user: { id: userId },
      sale: createCommentDto.sale_id ? { id: createCommentDto.sale_id } : undefined,
      store: createCommentDto.store_id ? { id: createCommentDto.store_id } : undefined,
      targetUser: createCommentDto.target_user_id ? { id: createCommentDto.target_user_id } : undefined,
    });

    const savedComment = await this.commentsRepository.save(comment);

    // Si es un comentario en una venta
    if (createCommentDto.sale_id) {
      try {
        // Obtener el vendedor de la venta
        const sale = await this.commentsRepository
          .createQueryBuilder('comment')
          .leftJoinAndSelect('comment.sale', 'sale')
          .leftJoinAndSelect('sale.seller', 'seller')
          .leftJoinAndSelect('comment.user', 'author')
          .where('comment.id = :id', { id: savedComment.id })
          .getOne();

        if (sale?.sale?.seller?.id) {
          const metadata = {
            comment_id: savedComment.id,
            sale_id: createCommentDto.sale_id,
            sale_name: sale.sale.name,
            user_id: userId,
            comment_author_id: userId,
            comment_author_name: sale.user?.name,
          };

          // Notify only the seller and avoid self-notifications.
          if (sale.sale.seller.id !== userId) {
            await this.notificationsService.create({
              user_id: sale.sale.seller.id,
              type: NotificationType.COMMENT_RECEIVED,
              metadata,
            });
          }
        }
      } catch (error) {
        // Comentarios no deben fallar por problemas de notificaciones/suscripciones.
      }
      }

    return savedComment;
  }

  async subscribeToSaleComments(userId: string, saleId: string): Promise<CommentSubscription> {
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: { user: { id: userId }, sale: { id: saleId } },
    });

    if (existingSubscription) {
      return existingSubscription;
    }

    const subscription = this.subscriptionRepository.create({
      user: { id: userId },
      sale: { id: saleId }
    });

    try {
      return await this.subscriptionRepository.save(subscription);
    } catch (error) {
      if (error?.code === '23505') {
        const duplicateSubscription = await this.subscriptionRepository.findOne({
          where: { user: { id: userId }, sale: { id: saleId } },
        });

        if (duplicateSubscription) {
          return duplicateSubscription;
        }

        throw new ConflictException('Subscription to sale comments already exists');
      }

      throw error;
    }
  }

  async unsubscribeFromSaleComments(userId: string, saleId: string): Promise<void> {
    await this.subscriptionRepository.delete({
      user: { id: userId },
      sale: { id: saleId }
    });
  }

  async getSubscribersForSale(saleId: string): Promise<CommentSubscription[]> {
    return this.subscriptionRepository.find({
      where: { sale: { id: saleId } },
      relations: ['user']
    });
  }

  async findAllForSale(saleId: string): Promise<PublicComment[]> {
    const comments = await this.commentsRepository.find({
      where: { sale: { id: saleId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });

    return comments.map((comment) => ({
      id: comment.id,
      rating: comment.rating ?? null,
      content: comment.content,
      created_at: comment.created_at,
      user: {
        id: comment.user.id,
        name: comment.user.name,
        is_store: comment.user.is_store,
        avatar_url: comment.user.avatar_url,
      },
    }));
  }

  async findAllForStore(storeId: string): Promise<PublicComment[]> {
    const comments = await this.commentsRepository.find({
      where: { store: { id: storeId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });

    return comments.map((comment) => ({
      id: comment.id,
      rating: comment.rating ?? null,
      content: comment.content,
      created_at: comment.created_at,
      user: {
        id: comment.user.id,
        name: comment.user.name,
        is_store: comment.user.is_store,
        avatar_url: comment.user.avatar_url,
      },
    }));
  }

  async findAllForUser(userId: string): Promise<PublicComment[]> {
    const comments = await this.commentsRepository.find({
      where: { targetUser: { id: userId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });

    return comments.map((comment) => ({
      id: comment.id,
      rating: comment.rating ?? null,
      content: comment.content,
      created_at: comment.created_at,
      user: {
        id: comment.user.id,
        name: comment.user.name,
        is_store: comment.user.is_store,
        avatar_url: comment.user.avatar_url,
      },
    }));
  }

  async findAllByAuthor(userId: string): Promise<PublicComment[]> {
    const comments = await this.commentsRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });

    return comments.map((comment) => ({
      id: comment.id,
      rating: comment.rating ?? null,
      content: comment.content,
      created_at: comment.created_at,
      user: {
        id: comment.user.id,
        name: comment.user.name,
        is_store: comment.user.is_store,
        avatar_url: comment.user.avatar_url,
      },
    }));
  }
}
