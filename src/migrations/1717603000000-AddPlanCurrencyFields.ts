import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlanCurrencyFields1717603000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE subscriptionplans
      ADD COLUMN IF NOT EXISTS price_amount integer,
      ADD COLUMN IF NOT EXISTS price_currency varchar(3);
    `);

    await queryRunner.query(`
      UPDATE subscriptionplans
      SET
        price_amount = CASE
          WHEN tier = 'free' THEN 0
          WHEN tier = 'pro' THEN 4990
          WHEN tier = 'store' THEN 9990
          ELSE ROUND(CAST(price AS numeric) * 1000)
        END,
        price_currency = COALESCE(price_currency, 'CLP')
      WHERE price_amount IS NULL OR price_currency IS NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE subscriptionplans
      ALTER COLUMN price_amount SET NOT NULL,
      ALTER COLUMN price_currency SET NOT NULL,
      ALTER COLUMN price_currency SET DEFAULT 'CLP';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE subscriptionplans
      DROP COLUMN IF EXISTS price_currency,
      DROP COLUMN IF EXISTS price_amount;
    `);
  }
}
