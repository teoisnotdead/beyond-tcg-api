import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Role } from '../../common/enums/roles.enum';
import { UserRating } from '../../ratings/entities/user-rating.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({ default: false })
  is_store: boolean;

  @Column({ nullable: true })
  google_id?: string;

  @Column({ nullable: true })
  avatar_url?: string;

  @Column({ nullable: true })
  current_subscription_id?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  refresh_token?: string;

  @Column({ nullable: true, type: 'timestamp' })
  refresh_token_expires_at?: Date;

  @OneToMany(() => UserRating, (rating) => rating.user)
  ratingsReceived: UserRating[];

  @OneToMany(() => UserRating, (rating) => rating.rater)
  ratingsGiven: UserRating[];
}