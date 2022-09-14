import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

}
