import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../entities/user.entity.js';
import { RegistrationCode } from '../../entities/registration-code.entity.js';
import { UserRole, RegistrationCodeStatus } from '../../entities/enums.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { CreateRegistrationCodeDto } from './dto/create-registration-code.dto.js';
import { JwtPayload } from './strategies/jwt.strategy.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RegistrationCode)
    private readonly regCodeRepo: Repository<RegistrationCode>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const regCode = await this.regCodeRepo.findOne({
      where: { code: dto.registration_code, status: RegistrationCodeStatus.ACTIVE },
    });
    if (!regCode) {
      throw new BadRequestException('Invalid or already used registration code');
    }

    if (regCode.role === UserRole.CLIENT) {
      throw new ForbiddenException('Client accounts are created via Telegram only');
    }

    if (dto.email) {
      const existing = await this.userRepo.findOne({ where: { email: dto.email } });
      if (existing) {
        throw new ConflictException('Email already in use');
      }
    }

    const password_hash = await argon2.hash(dto.password);

    const user = this.userRepo.create({
      full_name: dto.full_name,
      email: dto.email || null,
      phone: dto.phone || null,
      role: regCode.role,
      reg_code_id: regCode.id,
      password_hash,
    });
    await this.userRepo.save(user);

    regCode.status = RegistrationCodeStatus.USED;
    regCode.used_by = user.id;
    await this.regCodeRepo.save(regCode);

    const tokens = await this.issueTokens(user);
    return {
      user: { id: user.id, full_name: user.full_name, role: user.role },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.locked_until && user.locked_until > new Date()) {
      const minutes = Math.ceil((user.locked_until.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`Account locked. Try again in ${minutes} minute(s).`);
    }

    const valid = await argon2.verify(user.password_hash, dto.password);
    if (!valid) {
      user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;
      if (user.failed_login_attempts >= 5) {
        user.locked_until = new Date(Date.now() + 15 * 60 * 1000);
        user.failed_login_attempts = 0;
      }
      await this.userRepo.save(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.failed_login_attempts > 0 || user.locked_until) {
      user.failed_login_attempts = 0;
      user.locked_until = null;
      await this.userRepo.save(user);
    }

    const tokens = await this.issueTokens(user);
    return {
      user: { id: user.id, full_name: user.full_name, role: user.role },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user?.refresh_token_hash) {
        throw new UnauthorizedException('User not found or logged out');
      }

      const valid = await argon2.verify(user.refresh_token_hash, refreshToken);
      if (!valid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async createRegistrationCode(dto: CreateRegistrationCodeDto, issuerId: string) {
    const code = dto.code || uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();

    const existing = await this.regCodeRepo.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException('Registration code already exists');
    }

    const regCode = this.regCodeRepo.create({
      code,
      role: dto.role,
      issued_by: issuerId,
      status: RegistrationCodeStatus.ACTIVE,
    });
    return this.regCodeRepo.save(regCode);
  }

  async listRegistrationCodes() {
    return this.regCodeRepo.find({
      order: { created_at: 'DESC' },
      relations: { issuedByUser: true, usedByUser: true },
    });
  }

  async logout(userId: string) {
    await this.userRepo.update(userId, { refresh_token_hash: null });
  }

  async issueTokens(user: User) {
    const accessPayload: JwtPayload = { sub: user.id, role: user.role, type: 'access' };
    const refreshPayload: JwtPayload = { sub: user.id, role: user.role, type: 'refresh' };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m') as any,
      }),
      this.jwtService.signAsync(refreshPayload, {
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d') as any,
      }),
    ]);

    user.refresh_token_hash = await argon2.hash(refresh_token);
    await this.userRepo.save(user);

    return { access_token, refresh_token };
  }
}
