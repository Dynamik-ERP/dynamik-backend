import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';

// Mock uuid before importing auth.service.js
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid'),
}));
jest.mock('argon2');

import { AuthService } from './auth.service.js';
import { User } from '../../entities/user.entity.js';
import { RegistrationCode } from '../../entities/registration-code.entity.js';
import { UserRole, RegistrationCodeStatus } from '../../entities/enums.js';
import * as argon2 from 'argon2';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: Repository<User>;
  let regCodeRepo: Repository<RegistrationCode>;

  const mockUserRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockRegCodeRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key, def) => def),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(RegistrationCode), useValue: mockRegCodeRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    regCodeRepo = module.get<Repository<RegistrationCode>>(getRepositoryToken(RegistrationCode));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a staff user successfully', async () => {
      const regCode = {
        id: 'code-uuid',
        code: 'TESTCODE',
        role: UserRole.DESIGN,
        status: RegistrationCodeStatus.ACTIVE,
      } as RegistrationCode;

      mockRegCodeRepo.findOne.mockResolvedValue(regCode);
      mockUserRepo.findOne.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockUserRepo.create.mockReturnValue({
        id: 'user-uuid',
        full_name: 'John Doe',
        role: UserRole.DESIGN,
      });
      mockUserRepo.save.mockResolvedValue({ id: 'user-uuid' });
      mockJwtService.signAsync.mockResolvedValue('token');

      const result = await service.register({
        registration_code: 'TESTCODE',
        full_name: 'John Doe',
        password: 'Password123!',
      });

      expect(result.user.role).toBe(UserRole.DESIGN);
      expect(mockRegCodeRepo.save).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('rejects a refresh token that does not match the stored server-side hash', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-uuid',
        role: UserRole.DESIGN,
        type: 'refresh',
      });
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-uuid',
        role: UserRole.DESIGN,
        refresh_token_hash: 'stored-refresh-hash',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.refresh('stale-refresh-token')).rejects.toThrow(
        'Invalid or expired refresh token',
      );
    });
  });
});
