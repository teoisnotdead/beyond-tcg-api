import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  SALE_CREATED = 'sale_created',
  SALE_UPDATED = 'sale_updated',
  SALE_DELETED = 'sale_deleted',
  SALE_RESERVED = 'sale_reserved',
  SALE_SHIPPED = 'sale_shipped',
  SALE_DELIVERED = 'sale_delivered',
  SALE_COMPLETED = 'sale_completed',
  SALE_CANCELLED = 'sale_cancelled',
  PURCHASE_CREATED = 'purchase_created',
  PURCHASE_UPDATED = 'purchase_updated',
  RATING_RECEIVED = 'rating_received',
  COMMENT_RECEIVED = 'comment_received',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  SUBSCRIPTION_EXPIRED = 'subscription_expired',
  SYSTEM_NOTIFICATION = 'system_notification',
  FAVORITE_ADDED = 'favorite_added'
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM_NOTIFICATION
  })
  type: NotificationType;

  @Column({ nullable: true })
  title?: string;

  @Column('text', { nullable: true })
  message?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ default: false })
  is_read: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
} 