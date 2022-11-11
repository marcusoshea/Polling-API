import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({name: 'PollingNotes'})
export class PollingNotes {
  @PrimaryGeneratedColumn()
  public polling_notes_id!: number;

  @Column({ type: 'varchar'})
  public note: string;

  @Column({ type: 'integer' })
  public vote: number;

  @Column({ type: 'integer' })
  public polling_id: number;
  
  @Column({ type: 'integer' })
  public candidate_id: number;

  @Column({ type: 'integer' })
  public polling_order_id: number;

  @CreateDateColumn({ type: 'timestamp' })
  public pn_created_at!: Date;

  @Column({ type: 'integer' })
  public polling_order_member_id: number;

  @Column({ type: 'bool' })
  public completed: boolean;
  
  @Column({ type: 'bool' })
  public private: boolean;

}
