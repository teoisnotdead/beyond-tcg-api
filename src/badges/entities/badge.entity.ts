import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type BadgeType = 'user' | 'store';
export type BadgeCategory = 'level' | 'reputation' | 'plan' | 'volume' | 'quality' | 'specialty';

@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  description: string;

  @Column({ type: 'varchar' })
  type: BadgeType;

  @Column({ type: 'varchar' })
  category: BadgeCategory;

  @Column({ name: 'icon_url' })
  iconUrl: string;

  @Column({ type: 'jsonb' })
  criteria: any;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
export default Badge; 