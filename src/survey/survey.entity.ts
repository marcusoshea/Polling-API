import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { PollingOrder } from '../polling_order/polling_order.entity';
import { Member as PollingOrderMember } from '../member/member.entity';
import { SurveyResponse } from './survey_response.entity';

@Entity({ name: 'Surveys' })
export class Survey {
  @PrimaryGeneratedColumn()
  public survey_id!: number;

  @Column({ type: 'integer' })
  public polling_order_id: number;

  @Column({ type: 'text' })
  public question: string;

  @Column({ type: 'timestamp' })
  public start_date: Date;

  @Column({ type: 'timestamp' })
  public end_date: Date;

  @CreateDateColumn({ type: 'timestamp' })
  public created_at: Date;

  @Column({ type: 'integer' })
  public created_by: number;

  @ManyToOne(() => PollingOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'polling_order_id' })
  public pollingOrder: PollingOrder;

  @ManyToOne(() => PollingOrderMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  public creator: PollingOrderMember;

  @OneToMany(() => SurveyResponse, response => response.survey)
  public responses: SurveyResponse[];
}
