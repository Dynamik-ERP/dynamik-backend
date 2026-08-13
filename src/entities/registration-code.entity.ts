import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserRole, RegistrationCodeStatus } from './enums';
import { User } from './user.entity';

@Entity('registration_codes')
export class RegistrationCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32, unique: true })
  code: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  issued_by: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'issued_by' })
  issuedByUser: User;

  @Column({
    type: 'varchar',
    length: 16,
    default: RegistrationCodeStatus.ACTIVE,
  })
  status: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  used_by: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'used_by' })
  usedByUser: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
