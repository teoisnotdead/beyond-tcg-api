import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Sale } from '../../sales/entities/sale.entity';

@Entity('comment_subscriptions')
@Unique(['user', 'sale'])
export class CommentSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
  
  @ManyToOne(() => Sale)
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;
  
  @CreateDateColumn()
  created_at: Date;
} 