import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(data: {
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: any;
  }): Promise<Notification> {
    const notification = this.notificationsRepository.create(data);
    const savedNotification = await this.notificationsRepository.save(notification);
    
    // Emitir la notificación a través del WebSocket
    this.notificationsGateway.server.to(data.user_id).emit('notification', savedNotification);
    
    return savedNotification;
  }

  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const [notifications, total] = await this.notificationsRepository.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId, user_id: userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.is_read = true;
    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { user_id: userId, is_read: false },
      { is_read: true }
    );
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.notificationsRepository.delete({
      id: notificationId,
      user_id: userId,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { user_id: userId, is_read: false },
    });
  }
} 