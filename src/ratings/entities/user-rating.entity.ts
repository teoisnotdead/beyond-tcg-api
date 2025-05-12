import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Sale } from '../../sales/entities/sale.entity';

@Entity('UserRatings')
export class UserRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.ratingsReceived, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => User, (user) => user.ratingsGiven, { onDelete: 'SET NULL' })
  rater: User;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Sale, { onDelete: 'CASCADE' })
  sale: Sale;
}
