import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Sale } from '../../sales/entities/sale.entity';

@Entity('favorites')
@Unique(['user', 'sale'])
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Sale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @CreateDateColumn()
  created_at: Date;
} 
