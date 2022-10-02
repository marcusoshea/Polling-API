import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Member } from '../member/member.entity';

@Entity({name: 'PollingOrder'})
export class Order {
  @PrimaryGeneratedColumn()
  public polling_order_id: number;

  @Column({ type: 'varchar', length: 120 })
  public polling_order_name: string;

  @Column({ type: 'integer' })
  public polling_order_admin: number;

  @Column({ type: 'integer' })
  public polling_order_admin_assistant: number;
}
