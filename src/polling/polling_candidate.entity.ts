import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({name: 'PollingCandidates'})
export class PollingCandidate {
  @PrimaryGeneratedColumn()
  public polling_candidate_id!: number;

  @Column({ type: 'integer' })
  public polling_id: number;

  @Column({ type: 'integer' })
  public candidate_id: number;

}

