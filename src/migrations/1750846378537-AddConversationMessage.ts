import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConversationMessage1750846378537 implements MigrationInterface {
  name = 'AddConversationMessage1750846378537';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."participant_role_enum" AS ENUM('admin', 'member')`,
    );
    await queryRunner.query(
      `CREATE TABLE "participant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversationId" uuid NOT NULL, "userId" uuid NOT NULL, "isBlocked" boolean NOT NULL DEFAULT false, "role" "public"."participant_role_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_64da4237f502041781ca15d4c41" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PARTICIPANT_CONVERSATION_ID" ON "participant" ("conversationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PARTICIPANT_USER_ID" ON "participant" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PARTICIPANT_CONVERSATION_ROLE" ON "participant" ("conversationId", "role") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_PARTICIPANT_USER_CONVERSATION" ON "participant" ("userId", "conversationId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."conversation_type_enum" AS ENUM('group', 'direct')`,
    );
    await queryRunner.query(
      `CREATE TABLE "conversation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "type" "public"."conversation_type_enum" NOT NULL, "photo" character varying, "description" character varying NOT NULL, "createdBy" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_864528ec4274360a40f66c29845" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_CONVERSATION_TYPE" ON "conversation" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_CONVERSATION_CREATED_BY" ON "conversation" ("createdBy") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_CONVERSATION_CREATED_AT" ON "conversation" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "attachment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "messageId" uuid NOT NULL, "url" character varying NOT NULL, "type" character varying NOT NULL, "size" integer NOT NULL, "name" character varying NOT NULL, "thumbnailUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d2a80c3a8d467f08a750ac4b420" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ATTACHMENT_MESSAGE_ID" ON "attachment" ("messageId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ATTACHMENT_TYPE" ON "attachment" ("type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "message_read" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "messageId" uuid NOT NULL, "userId" uuid NOT NULL, "readAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_de1b261e7d76b1fd564c24db0c9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_MESSAGE_READ_MESSAGE_ID" ON "message_read" ("messageId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_MESSAGE_READ_USER_ID" ON "message_read" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_MESSAGE_READ_USER_READ_AT" ON "message_read" ("userId", "readAt") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_MESSAGE_READ_MESSAGE_USER" ON "message_read" ("messageId", "userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "senderId" uuid NOT NULL, "content" character varying NOT NULL, "conversationId" uuid NOT NULL, "replyToMessageId" uuid, "isEdited" boolean NOT NULL DEFAULT false, "isDeleted" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_MESSAGE_SENDER_ID" ON "message" ("senderId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_MESSAGE_CONVERSATION_ID" ON "message" ("conversationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_MESSAGE_REPLY_TO_MESSAGE_ID" ON "message" ("replyToMessageId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_MESSAGE_CREATED_AT" ON "message" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_MESSAGE_SENDER_CREATED_AT" ON "message" ("senderId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_MESSAGE_CONVERSATION_CREATED_AT" ON "message" ("conversationId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_USER_PHONE" ON "user" ("phone") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_USER_EMAIL" ON "user" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_USER_IS_ONLINE" ON "user" ("isOnline") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_USER_LAST_SEEN" ON "user" ("lastSeen") `,
    );
    await queryRunner.query(
      `ALTER TABLE "participant" ADD CONSTRAINT "FK_b915e97dea27ffd1e40c8003b3b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant" ADD CONSTRAINT "FK_c03594530101ba8d1cf05bb137b" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD CONSTRAINT "FK_ebd13aba752ba2b903598ef7998" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachment" ADD CONSTRAINT "FK_5f4a6c0677b1f2b417e95c717f8" FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_read" ADD CONSTRAINT "FK_9799fb005881ecbe7f374fb8404" FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_read" ADD CONSTRAINT "FK_35cf48794dcc13e887887bbaffb" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" ADD CONSTRAINT "FK_bc096b4e18b1f9508197cd98066" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" ADD CONSTRAINT "FK_7cf4a4df1f2627f72bf6231635f" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" ADD CONSTRAINT "FK_59ea0cf113b1a3682cf202ec9bf" FOREIGN KEY ("replyToMessageId") REFERENCES "message"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message" DROP CONSTRAINT "FK_59ea0cf113b1a3682cf202ec9bf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" DROP CONSTRAINT "FK_7cf4a4df1f2627f72bf6231635f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" DROP CONSTRAINT "FK_bc096b4e18b1f9508197cd98066"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_read" DROP CONSTRAINT "FK_35cf48794dcc13e887887bbaffb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_read" DROP CONSTRAINT "FK_9799fb005881ecbe7f374fb8404"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachment" DROP CONSTRAINT "FK_5f4a6c0677b1f2b417e95c717f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" DROP CONSTRAINT "FK_ebd13aba752ba2b903598ef7998"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant" DROP CONSTRAINT "FK_c03594530101ba8d1cf05bb137b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant" DROP CONSTRAINT "FK_b915e97dea27ffd1e40c8003b3b"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_USER_LAST_SEEN"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_USER_IS_ONLINE"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_USER_EMAIL"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_USER_PHONE"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_MESSAGE_CONVERSATION_CREATED_AT"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_MESSAGE_SENDER_CREATED_AT"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_MESSAGE_CREATED_AT"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_MESSAGE_REPLY_TO_MESSAGE_ID"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_MESSAGE_CONVERSATION_ID"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_MESSAGE_SENDER_ID"`);
    await queryRunner.query(`DROP TABLE "message"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_MESSAGE_READ_MESSAGE_USER"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_MESSAGE_READ_USER_READ_AT"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_MESSAGE_READ_USER_ID"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_MESSAGE_READ_MESSAGE_ID"`,
    );
    await queryRunner.query(`DROP TABLE "message_read"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ATTACHMENT_TYPE"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ATTACHMENT_MESSAGE_ID"`);
    await queryRunner.query(`DROP TABLE "attachment"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_CONVERSATION_CREATED_AT"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_CONVERSATION_CREATED_BY"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_CONVERSATION_TYPE"`);
    await queryRunner.query(`DROP TABLE "conversation"`);
    await queryRunner.query(`DROP TYPE "public"."conversation_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_PARTICIPANT_USER_CONVERSATION"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_PARTICIPANT_CONVERSATION_ROLE"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_PARTICIPANT_USER_ID"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_PARTICIPANT_CONVERSATION_ID"`,
    );
    await queryRunner.query(`DROP TABLE "participant"`);
    await queryRunner.query(`DROP TYPE "public"."participant_role_enum"`);
  }
}
