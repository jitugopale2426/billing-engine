import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1773572594855 implements MigrationInterface {
    name = 'InitialMigration1773572594855'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ADD "webhook_url" character varying(500)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "webhook_url"`);
    }

}
