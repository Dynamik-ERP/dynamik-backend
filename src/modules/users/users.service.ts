import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from '../../entities/user.entity.js';
import { UserRole } from '../../entities/enums.js';
import { FilterUsersDto } from './dto/filter-users.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly userRepo: Repository<User>) {}

  async findAll(filters: FilterUsersDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const [data, total] = await this.userRepo.findAndCount({
      where: filters.role ? { role: filters.role } : {},
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepo.findOne({ where: { email: dto.email } });
      if (existing) throw new ConflictException('Email already in use');
    }
    Object.assign(user, dto);
    if (user.role === UserRole.CLIENT) {
      user.password_hash = null;
      user.reg_code_id = null;
    }
    return this.userRepo.save(user);
  }

  async softDelete(id: string) {
    await this.findOne(id);
    await this.userRepo.softDelete(id);
    return { id, deleted: true };
  }

  async resetPassword(id: string, dto: ResetPasswordDto) {
    const user = await this.findOne(id);
    if (user.role === UserRole.CLIENT) {
      throw new ConflictException('Client accounts do not use staff passwords');
    }
    user.password_hash = await argon2.hash(dto.password);
    user.refresh_token_hash = null;
    user.failed_login_attempts = 0;
    user.locked_until = null;
    return this.userRepo.save(user);
  }

  async unlock(id: string) {
    const user = await this.findOne(id);
    user.failed_login_attempts = 0;
    user.locked_until = null;
    return this.userRepo.save(user);
  }
}
