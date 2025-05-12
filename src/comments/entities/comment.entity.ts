import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Sale } from '../../sales/entities/sale.entity';
import { Store } from '../../stores/entities/store.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User; // The user who comments

  @ManyToOne(() => Sale, { nullable: true })
  @JoinColumn({ name: 'sale_id' })
  sale?: Sale; // Optional: comment on a sale

  @ManyToOne(() => Store, { nullable: true })
  @JoinColumn({ name: 'store_id' })
  store?: Store; // Optional: comment on a store

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'target_user_id' })
  targetUser?: User; // Optional: comment on a user

  @Column({ type: 'int', nullable: true })
  rating?: number; // Optional: for reviews (1-5 stars)

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  created_at: Date;
}
