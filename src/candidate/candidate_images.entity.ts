import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({name: 'CandidateImages'})
export class CandidateImages {
  @PrimaryGeneratedColumn()
  public image_id!: number;

  @Column({ type: 'integer' })
  public candidate_id: number;

  @Column({ type: 'text' })
  public image_description: string;
  
  @Column({ type: 'varchar', length: 120 })
  public aws_key: string;

}
