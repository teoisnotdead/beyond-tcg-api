import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CommentSubscription } from './entities/comment-subscription.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

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
      // Obtener el vendedor de la venta
      const sale = await this.commentsRepository
        .createQueryBuilder('comment')
        .leftJoinAndSelect('comment.sale', 'sale')
        .leftJoinAndSelect('sale.seller', 'seller')
        .where('comment.id = :id', { id: savedComment.id })
        .getOne();

      if (sale?.sale?.seller?.id) {
        // Notify the seller (only type and metadata, no title/message)
        await this.notificationsService.create({
          user_id: sale.sale.seller.id,
          type: NotificationType.COMMENT_RECEIVED,
          metadata: {
            comment_id: savedComment.id,
            sale_id: createCommentDto.sale_id,
            user_id: userId
          }
        });

        // Auto-subscribe the user who commented
        await this.subscribeToSaleComments(userId, createCommentDto.sale_id);

        // Notify all subscribers except the commenter
        const subscribers = await this.subscriptionRepository.find({
          where: { sale: { id: createCommentDto.sale_id } },
          relations: ['user']
        });

        for (const subscriber of subscribers) {
          if (subscriber.user.id !== userId) {
            await this.notificationsService.create({
              user_id: subscriber.user.id,
              type: NotificationType.COMMENT_RECEIVED,
              metadata: {
                comment_id: savedComment.id,
                sale_id: createCommentDto.sale_id,
                user_id: userId
              }
            });
          }
        }
      }
    }

    return savedComment;
  }

  async subscribeToSaleComments(userId: string, saleId: string): Promise<CommentSubscription> {
    const subscription = this.subscriptionRepository.create({
      user: { id: userId },
      sale: { id: saleId }
    });
    return this.subscriptionRepository.save(subscription);
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
