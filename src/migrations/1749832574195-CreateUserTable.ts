import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1749832574195 implements MigrationInterface {
  name = 'CreateUserTable1749832574195';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user" ("id" SERIAL NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "phone" character varying NOT NULL, "email" character varying NOT NULL, "profile_photo" character varying NOT NULL, "access_token" character varying NOT NULL, "refresh_token" character varying NOT NULL, "device_token" character varying NOT NULL, "isOnline" boolean NOT NULL, "lastSeen" TIMESTAMP NOT NULL, "about" character varying NOT NULL, "password" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
