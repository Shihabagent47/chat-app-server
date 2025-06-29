// src/seed/user.seed.ts
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

export async function seedUsers(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);

  const users = [
    {
      firstName: 'Shihab',
      lastName: 'Hossain',
      phone: '01700000001',
      email: 'shihab1@example.com',
      password: await bcrypt.hash('password123', 10),
      about: 'Chat app creator',
      isOnline: true,
    },
    {
      firstName: 'John',
      lastName: 'Doe',
      phone: '01700000002',
      email: 'john@example.com',
      password: await bcrypt.hash('password123', 10),
      about: 'Just a regular user',
      isOnline: false,
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '01700000003',
      email: 'jane@example.com',
      password: await bcrypt.hash('password123', 10),
      about: 'Design enthusiast',
      isOnline: true,
    },
  ];

  for (const userData of users) {
    const exists = await userRepo.findOne({ where: { email: userData.email } });
    if (!exists) {
      const user = userRepo.create(userData);
      await userRepo.save(user);
      console.log(`✅ Seeded user: ${user.email}`);
    } else {
      console.log(`⚠️  User already exists: ${userData.email}`);
    }
  }
}
