import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from '../../entities/user.entity.js';
import { UserRole } from '../../entities/enums.js';

export async function seedAdmin(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);

  const password = process.env.ADMIN_SEED_PASSWORD || 'DynamikAdmin2026!';
  const password_hash = await argon2.hash(password);

  const existingAdmin = await userRepo.findOne({ where: { role: UserRole.ADMIN } });
  if (existingAdmin) {
    existingAdmin.password_hash = password_hash;
    existingAdmin.email = process.env.ADMIN_SEED_EMAIL || 'admin@dynamik.com';
    await userRepo.save(existingAdmin);
    console.log(`Admin user password updated to match seed configuration.`);
    return;
  }

  const admin = userRepo.create({
    full_name: process.env.ADMIN_SEED_NAME || 'System Admin',
    email: process.env.ADMIN_SEED_EMAIL || 'admin@dynamik.com',
    role: UserRole.ADMIN,
    password_hash,
  });

  await userRepo.save(admin);
  console.log(`Admin user seeded: ${admin.email}`);
}
