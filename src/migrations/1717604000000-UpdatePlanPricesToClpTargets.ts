import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePlanPricesToClpTargets1717604000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE subscriptionplans
      SET
        price_amount = CASE
          WHEN tier = 'free' THEN 0
          WHEN tier = 'pro' THEN 4990
          WHEN tier = 'store' THEN 9990
          ELSE price_amount
        END,
        price_currency = 'CLP'
      WHERE tier IN ('free', 'pro', 'store');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE subscriptionplans
      SET
        price_amount = CASE
          WHEN tier = 'free' THEN 0
          WHEN tier = 'pro' THEN 9990
          WHEN tier = 'store' THEN 19990
          ELSE price_amount
        END,
        price_currency = 'CLP'
      WHERE tier IN ('free', 'pro', 'store');
    `);
  }
}
