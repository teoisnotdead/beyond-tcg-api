import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { StoreSocialLink } from './store-social-link.entity';
import { StoreRating } from '../../ratings/entities/store-rating.entity';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  name: string;

  @Column({ nullable: true })
  avatar_url?: string;

  @Column({ nullable: true })
  banner_url?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  location?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => StoreSocialLink, (link) => link.store, { cascade: true })
  socialLinks: StoreSocialLink[];

  @OneToMany(() => StoreRating, (rating) => rating.store)
  ratings: StoreRating[];
}
