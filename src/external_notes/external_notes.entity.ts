import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({name: 'ExternalNotes'})
export class ExternalNotes {
  @PrimaryGeneratedColumn()
  public external_notes_id!: number;

  @Column({ type: 'integer' })
  public candidate_id: number;

  @Column({ type: 'integer' })
  public polling_order_member_id: number;
  
  @Column({ type: 'varchar' })
  public external_note: string;

  @CreateDateColumn({ type: 'timestamp' })
  public en_created_at!: Date;

}
