import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1773562533887 implements MigrationInterface {
    name = 'InitialMigration1773562533887'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "email" character varying(255) NOT NULL, "billing_details" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03" UNIQUE ("email"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_customer_email" ON "customers" ("email") `);
        await queryRunner.query(`CREATE TYPE "public"."plans_billing_cycle_enum" AS ENUM('monthly', 'annual')`);
        await queryRunner.query(`CREATE TABLE "plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "billing_cycle" "public"."plans_billing_cycle_enum" NOT NULL, "price" bigint NOT NULL, "feature_limits" jsonb NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_plan_name" ON "plans" ("name") `);
        await queryRunner.query(`CREATE INDEX "idx_plan_is_active" ON "plans" ("is_active") `);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('active', 'past_due', 'cancelled', 'expired')`);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'active', "start_date" TIMESTAMP NOT NULL, "current_period_start" TIMESTAMP NOT NULL, "current_period_end" TIMESTAMP NOT NULL, "next_renewal_date" TIMESTAMP NOT NULL, "past_due_since" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "customer_id" uuid NOT NULL, "plan_id" uuid NOT NULL, CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_sub_next_renewal" ON "subscriptions" ("next_renewal_date") `);
        await queryRunner.query(`CREATE INDEX "idx_sub_status_renewal" ON "subscriptions" ("status", "next_renewal_date") `);
        await queryRunner.query(`CREATE TABLE "usage_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "resource_type" character varying(100) NOT NULL, "quantity" numeric(10,2) NOT NULL, "recorded_at" TIMESTAMP NOT NULL DEFAULT now(), "subscription_id" uuid NOT NULL, CONSTRAINT "PK_c9f17d50873fab2c46615f542bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_usage_recorded_at" ON "usage_events" ("recorded_at") `);
        await queryRunner.query(`CREATE INDEX "idx_usage_sub_resource_time" ON "usage_events" ("subscription_id", "resource_type", "recorded_at") `);
        await queryRunner.query(`CREATE TYPE "public"."invoices_status_enum" AS ENUM('draft', 'issued', 'paid', 'overdue')`);
        await queryRunner.query(`CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invoice_number" character varying NOT NULL, "status" "public"."invoices_status_enum" NOT NULL DEFAULT 'draft', "subtotal" bigint NOT NULL DEFAULT '0', "tax" bigint NOT NULL DEFAULT '0', "total" bigint NOT NULL DEFAULT '0', "due_date" TIMESTAMP NOT NULL, "paid_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "subscription_id" uuid NOT NULL, CONSTRAINT "UQ_d8f8d3788694e1b3f96c42c36fb" UNIQUE ("invoice_number"), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_invoice_number" ON "invoices" ("invoice_number") `);
        await queryRunner.query(`CREATE INDEX "idx_invoice_due_date" ON "invoices" ("due_date") `);
        await queryRunner.query(`CREATE INDEX "idx_invoice_subscription_id" ON "invoices" ("subscription_id") `);
        await queryRunner.query(`CREATE TABLE "invoice_line_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying(255) NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "unit_price" bigint NOT NULL, "amount" bigint NOT NULL, "invoice_id" uuid NOT NULL, CONSTRAINT "PK_4e8ccaadaf5d0619db9d219b061" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_line_item_invoice_id" ON "invoice_line_items" ("invoice_id") `);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_98a4e1e3025f768de1493ecedec" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usage_events" ADD CONSTRAINT "FK_2fe9b093418d80c6e41c0f9721a" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_5152c0aa0f851d9b95972b442e0" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice_line_items" ADD CONSTRAINT "FK_e554609a06b180dac66a9a977c5" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoice_line_items" DROP CONSTRAINT "FK_e554609a06b180dac66a9a977c5"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_5152c0aa0f851d9b95972b442e0"`);
        await queryRunner.query(`ALTER TABLE "usage_events" DROP CONSTRAINT "FK_2fe9b093418d80c6e41c0f9721a"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_98a4e1e3025f768de1493ecedec"`);
        await queryRunner.query(`DROP INDEX "public"."idx_line_item_invoice_id"`);
        await queryRunner.query(`DROP TABLE "invoice_line_items"`);
        await queryRunner.query(`DROP INDEX "public"."idx_invoice_subscription_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_invoice_due_date"`);
        await queryRunner.query(`DROP INDEX "public"."idx_invoice_number"`);
        await queryRunner.query(`DROP TABLE "invoices"`);
        await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_usage_sub_resource_time"`);
        await queryRunner.query(`DROP INDEX "public"."idx_usage_recorded_at"`);
        await queryRunner.query(`DROP TABLE "usage_events"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sub_status_renewal"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sub_next_renewal"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_plan_is_active"`);
        await queryRunner.query(`DROP INDEX "public"."idx_plan_name"`);
        await queryRunner.query(`DROP TABLE "plans"`);
        await queryRunner.query(`DROP TYPE "public"."plans_billing_cycle_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_customer_email"`);
        await queryRunner.query(`DROP TABLE "customers"`);
    }

}
