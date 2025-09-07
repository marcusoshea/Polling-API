import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PollingOrder } from '../polling_order/polling_order.entity';

@Entity({ name: 'OrderPolicies' })
export class OrderPolicies {
  @PrimaryGeneratedColumn()
  public order_policy_id: number;

  @Column({ type: 'integer' })
  public polling_order_id: number;

  @Column({ type: 'text', nullable: true })
  public polling_order_policy: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  public created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  public updated_at: Date;

  // Relationship with PollingOrder
  @ManyToOne(() => PollingOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'polling_order_id' })
  public pollingOrder: PollingOrder;
}
