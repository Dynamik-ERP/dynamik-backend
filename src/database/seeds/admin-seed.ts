import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from '../../entities/user.entity.js';
import { UserRole } from '../../entities/enums.js';

export async function seedAdmin(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);

  const existingAdmin = await userRepo.findOne({ where: { role: UserRole.ADMIN } });
  if (existingAdmin) {
    console.log('Admin user already exists, skipping seed.');
    return;
  }

  const password_hash = await argon2.hash(
    process.env.ADMIN_SEED_PASSWORD || 'Admin123!',
  );

  const admin = userRepo.create({
    full_name: process.env.ADMIN_SEED_NAME || 'System Admin',
    email: process.env.ADMIN_SEED_EMAIL || 'admin@dynamik.com',
    role: UserRole.ADMIN,
    password_hash,
  });

  await userRepo.save(admin);
  console.log(`Admin user seeded: ${admin.email}`);
}
