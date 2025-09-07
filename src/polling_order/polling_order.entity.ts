import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({name: 'PollingOrder'})
export class PollingOrder {
  @PrimaryGeneratedColumn()
  public polling_order_id: number;

  @Column({ type: 'varchar', length: 120 })
  public polling_order_name: string;

  @Column({ type: 'integer' })
  public polling_order_admin: number;

  @Column({ type: 'integer' })
  public polling_order_admin_assistant: number;

  @Column({ type: 'integer' })
  public polling_order_notes_time_visible: number;

  @Column({ type: 'integer', nullable: true })
  public polling_order_polling_participation: number;

  @Column({ type: 'integer', nullable: true })
  public polling_order_polling_score: number;

  @Column({ type: 'integer', nullable: true })
  public polling_order_polling_type: number;

}
