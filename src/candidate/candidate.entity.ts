import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({name: 'Candidate'})
export class Candidate {
  @PrimaryGeneratedColumn()
  public candidate_id!: number;

  @Column({ type: 'varchar', length: 120 })
  public name: string;

  @Column({ type: 'integer' })
  public polling_order_id: number;

}
