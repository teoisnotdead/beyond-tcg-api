import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Store } from './store.entity';

@Entity('store_social_links')
export class StoreSocialLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Store, (store) => store.socialLinks)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column()
  platform: string; // facebook, twitter, instagram, etc.

  @Column()
  url: string;
}
