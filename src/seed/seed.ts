// src/seed/seed.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { seedUsers } from './user.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  await seedUsers(dataSource);

  await app.close();
  console.log('✅ Seeding completed!');
}

bootstrap().catch((err) => {
  console.error('❌ Seeding failed', err);
});
