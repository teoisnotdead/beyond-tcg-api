import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTimestampsTimezoneAcrossTables1717602000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const timestampColumns: Array<{ table: string; column: string }> = [
      { table: 'users', column: 'created_at' },
      { table: 'users', column: 'updated_at' },
      { table: 'users', column: 'refresh_token_expires_at' },
      { table: 'subscriptionplans', column: 'created_at' },
      { table: 'subscriptionplans', column: 'updated_at' },
      { table: 'usersubscriptions', column: 'start_date' },
      { table: 'usersubscriptions', column: 'end_date' },
      { table: 'usersubscriptions', column: 'created_at' },
      { table: 'usersubscriptions', column: 'updated_at' },
      { table: 'categories', column: 'created_at' },
      { table: 'categories', column: 'updated_at' },
      { table: 'languages', column: 'created_at' },
      { table: 'languages', column: 'updated_at' },
      { table: 'stores', column: 'created_at' },
      { table: 'stores', column: 'updated_at' },
      { table: 'sales', column: 'reserved_at' },
      { table: 'sales', column: 'shipped_at' },
      { table: 'sales', column: 'delivered_at' },
      { table: 'sales', column: 'completed_at' },
      { table: 'sales', column: 'cancelled_at' },
      { table: 'sales', column: 'created_at' },
      { table: 'sales_cancelled', column: 'cancelled_at' },
      { table: 'sales_cancelled', column: 'created_at' },
      { table: 'purchases', column: 'created_at' },
      { table: 'favorites', column: 'created_at' },
      { table: 'storeratings', column: 'created_at' },
      { table: 'userratings', column: 'created_at' },
      { table: 'notifications', column: 'created_at' },
      { table: 'notifications', column: 'updated_at' },
      { table: 'badges', column: 'created_at' },
      { table: 'badges', column: 'updated_at' },
      { table: 'userbadges', column: 'awarded_at' },
      { table: 'userbadges', column: 'expires_at' },
      { table: 'userbadges', column: 'created_at' },
      { table: 'userbadges', column: 'updated_at' },
      { table: 'storebadges', column: 'awarded_at' },
      { table: 'storebadges', column: 'expires_at' },
      { table: 'storebadges', column: 'created_at' },
      { table: 'storebadges', column: 'updated_at' },
      { table: 'comment_subscriptions', column: 'created_at' },
    ];

    for (const { table, column } of timestampColumns) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = '${table}'
              AND column_name = '${column}'
              AND data_type = 'timestamp without time zone'
          ) THEN
            ALTER TABLE ${table}
            ALTER COLUMN ${column} TYPE timestamptz
            USING ${column} AT TIME ZONE 'UTC';
          END IF;
        END $$;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const timestampColumns: Array<{ table: string; column: string }> = [
      { table: 'users', column: 'created_at' },
      { table: 'users', column: 'updated_at' },
      { table: 'users', column: 'refresh_token_expires_at' },
      { table: 'subscriptionplans', column: 'created_at' },
      { table: 'subscriptionplans', column: 'updated_at' },
      { table: 'usersubscriptions', column: 'start_date' },
      { table: 'usersubscriptions', column: 'end_date' },
      { table: 'usersubscriptions', column: 'created_at' },
      { table: 'usersubscriptions', column: 'updated_at' },
      { table: 'categories', column: 'created_at' },
      { table: 'categories', column: 'updated_at' },
      { table: 'languages', column: 'created_at' },
      { table: 'languages', column: 'updated_at' },
      { table: 'stores', column: 'created_at' },
      { table: 'stores', column: 'updated_at' },
      { table: 'sales', column: 'reserved_at' },
      { table: 'sales', column: 'shipped_at' },
      { table: 'sales', column: 'delivered_at' },
      { table: 'sales', column: 'completed_at' },
      { table: 'sales', column: 'cancelled_at' },
      { table: 'sales', column: 'created_at' },
      { table: 'sales_cancelled', column: 'cancelled_at' },
      { table: 'sales_cancelled', column: 'created_at' },
      { table: 'purchases', column: 'created_at' },
      { table: 'favorites', column: 'created_at' },
      { table: 'storeratings', column: 'created_at' },
      { table: 'userratings', column: 'created_at' },
      { table: 'notifications', column: 'created_at' },
      { table: 'notifications', column: 'updated_at' },
      { table: 'badges', column: 'created_at' },
      { table: 'badges', column: 'updated_at' },
      { table: 'userbadges', column: 'awarded_at' },
      { table: 'userbadges', column: 'expires_at' },
      { table: 'userbadges', column: 'created_at' },
      { table: 'userbadges', column: 'updated_at' },
      { table: 'storebadges', column: 'awarded_at' },
      { table: 'storebadges', column: 'expires_at' },
      { table: 'storebadges', column: 'created_at' },
      { table: 'storebadges', column: 'updated_at' },
      { table: 'comment_subscriptions', column: 'created_at' },
      { table: 'comments', column: 'created_at' },
    ];

    for (const { table, column } of timestampColumns) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = '${table}'
              AND column_name = '${column}'
              AND data_type = 'timestamp with time zone'
          ) THEN
            ALTER TABLE ${table}
            ALTER COLUMN ${column} TYPE timestamp
            USING ${column} AT TIME ZONE 'UTC';
          END IF;
        END $$;
      `);
    }
  }
}
