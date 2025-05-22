import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Store } from '../../stores/entities/store.entity'; // Si tienes stores
import { Category } from '../../categories/entities/category.entity';
import { Language } from '../../languages/entities/language.entity';

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @Column({ nullable: true })
  buyer_id?: string;

  @Column({ nullable: true })
  store_id?: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  image_url?: string;

  @Column()
  quantity: number;

  @Column({ default: 'available' })
  status: string;

  @Column({ default: 0 })
  views: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Language)
  @JoinColumn({ name: 'language_id' })
  language: Language;

  @Column({ nullable: true })
  shipping_proof_url?: string;

  @Column({ nullable: true })
  delivery_proof_url?: string;

  @Column({ nullable: true, type: 'timestamp' })
  reserved_at?: Date;

  @Column({ nullable: true, type: 'timestamp' })
  shipped_at?: Date;

  @Column({ nullable: true, type: 'timestamp' })
  delivered_at?: Date;

  @Column({ nullable: true, type: 'timestamp' })
  completed_at?: Date;

  @Column({ nullable: true, type: 'timestamp' })
  cancelled_at?: Date;

  @CreateDateColumn()
  created_at: Date;
}
