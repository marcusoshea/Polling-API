import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({name: 'Polling'})
export class Polling {
  @PrimaryGeneratedColumn()
  public polling_id!: number;

  @Column({ type: 'varchar', length: 120 })
  public polling_name: string;

  @Column({ type: 'integer' })
  public polling_order_id: number;

  @CreateDateColumn({ type: 'timestamp' })
  public start_date: Date;

  @CreateDateColumn({ type: 'timestamp' })
  public end_date: Date;

}
