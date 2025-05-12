import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { User } from '../../users/entities/user.entity';
import { Sale } from '../../sales/entities/sale.entity';

@Entity('StoreRatings')
export class StoreRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Store, store => store.ratings, { onDelete: 'CASCADE' })
  store: Store;

  @ManyToOne(() => User, user => user.ratingsGiven, { onDelete: 'SET NULL' })
  rater: User;

  @ManyToOne(() => Sale, { onDelete: 'CASCADE' })
  sale: Sale;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  created_at: Date;
}