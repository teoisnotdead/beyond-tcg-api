import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCommentsCreatedAtTimezone1717601000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE comments
      ALTER COLUMN created_at TYPE timestamptz
      USING created_at AT TIME ZONE 'UTC';
    `);

    await queryRunner.query(`
      ALTER TABLE comments
      ALTER COLUMN created_at SET DEFAULT now();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE comments
      ALTER COLUMN created_at TYPE timestamp
      USING created_at AT TIME ZONE 'UTC';
    `);

    await queryRunner.query(`
      ALTER TABLE comments
      ALTER COLUMN created_at SET DEFAULT now();
    `);
  }
}
