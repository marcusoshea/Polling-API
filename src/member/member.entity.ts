import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { PollingOrder } from '../polling_order/polling_order.entity';

@Entity({name: 'PollingOrderMember'})
export class Member {
  @PrimaryGeneratedColumn()
  public polling_order_member_id!: number;

  @Column({ type: 'varchar', length: 120 })
  public name: string;

  @Column({ type: 'varchar', length: 120 })
  public email: string;

  @Column({ type: 'varchar', length: 120 })
  public password: string;

  @Column({ type: 'integer' })
  public polling_order_id: number;

  @CreateDateColumn({ type: 'timestamp' })
  public pom_created_at!: Date;

  @Column({ type: 'integer' })
  public new_password_token: number;

  @Column({ type: 'date' })
  public new_password_token_timestamp: Date;

  @Column({ type: 'boolean' })
  public approved: boolean;

  @Column({ type: 'boolean' })
  public removed: boolean;

  @Column({ type: 'boolean' })
  public active: boolean;

}
