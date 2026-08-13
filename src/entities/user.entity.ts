import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from './enums';
import { RegistrationCode } from './registration-code.entity';
import { Order } from './order.entity';
import { Notification } from './notification.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  full_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  email: string | null;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ type: 'uuid', nullable: true })
  reg_code_id: string | null;

  @ManyToOne(() => RegistrationCode, { nullable: true })
  @JoinColumn({ name: 'reg_code_id' })
  registrationCode: RegistrationCode;

  @Column({ type: 'text', nullable: true })
  password_hash: string | null;

  @Column({ type: 'text', nullable: true })
  refresh_token_hash: string | null;

  @Column({ type: 'int', default: 0 })
  failed_login_attempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  locked_until: Date | null;

  @Column({ type: 'bigint', unique: true, nullable: true })
  telegram_chat_id: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;

  @OneToMany(() => Order, (order) => order.client)
  clientOrders: Order[];

  @OneToMany(() => Order, (order) => order.handledByDesigner)
  designedOrders: Order[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
