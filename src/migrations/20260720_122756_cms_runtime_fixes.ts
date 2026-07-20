import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'
import { localizeStatus } from 'payload/migrations'

const localizedStatusCollections = [
  'event-series',
  'events',
  'people',
  'literary-works',
] as const

type MigrationDB = MigrateUpArgs['db']

/**
 * Payload 3.86's SQL `localizeStatus` helper calls `db.execute({ drizzle, sql })`
 * and reads `db.drizzle` — the shape of the Drizzle *adapter*. The migration
 * runner, however, passes the raw Drizzle transaction (`db.execute(sqlObject)`),
 * so the helper fails with `query.getSQL is not a function`. This bridge exposes
 * the adapter-style API on top of the real transaction, keeping every statement
 * inside the migration transaction.
 */
const bridgeForLocalizeStatus = (tx: MigrationDB) => ({
  drizzle: tx,
  execute: ({
    drizzle,
    raw,
    sql: statement,
  }: {
    drizzle?: MigrationDB
    raw?: string
    sql?: ReturnType<typeof sql>
  }) => (drizzle ?? tx).execute(raw ? sql.raw(raw) : sql`${statement}`),
})

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Payload's official migration reconstructs each locale's status from the
  // existing version history before moving the columns into locale tables.
  const localizeDb = bridgeForLocalizeStatus(db)
  for (const collectionSlug of localizedStatusCollections) {
    await localizeStatus.up({ collectionSlug, db: localizeDb, payload, req, sql })
  }

  // Homepage global: Payload 3.86's SQL `localizeStatus` helper mishandles
  // globals when the versions locales table already exists — it queries a
  // `parent_id` column that only collection version tables have, so it fails
  // with `column "parent_id" does not exist`. Replicate the same
  // transformation manually here, carrying the current shared publication
  // status into both locales (matching the collection behaviour above).
  await db.execute(
    sql`ALTER TABLE "_homepage_v_locales" ADD COLUMN IF NOT EXISTS "version__status" varchar;`,
  )
  await db.execute(sql`
    UPDATE "_homepage_v_locales" AS locale
      SET "version__status" = version."version__status"::text
      FROM "_homepage_v" AS version
      WHERE locale."_parent_id" = version."id";
  `)
  await db.execute(sql`ALTER TABLE "_homepage_v" DROP COLUMN "version__status";`)
  await db.execute(
    sql`ALTER TABLE "homepage_locales" ADD COLUMN IF NOT EXISTS "_status" varchar DEFAULT 'draft';`,
  )
  await db.execute(sql`
    UPDATE "homepage_locales" AS locale
      SET "_status" = main."_status"::text
      FROM "homepage" AS main
      WHERE locale."_parent_id" = main."id";
  `)
  await db.execute(sql`ALTER TABLE "homepage" DROP COLUMN "_status";`)

  await db.execute(sql`
    ALTER TABLE "event_series_locales"
      ALTER COLUMN "_status" DROP DEFAULT,
      ALTER COLUMN "_status" SET DATA TYPE "enum_event_series_status"
      USING "_status"::text::"enum_event_series_status",
      ALTER COLUMN "_status" SET DEFAULT 'draft';
    ALTER TABLE "_event_series_v_locales"
      ALTER COLUMN "version__status" DROP DEFAULT,
      ALTER COLUMN "version__status" SET DATA TYPE "enum__event_series_v_version_status"
      USING "version__status"::text::"enum__event_series_v_version_status",
      ALTER COLUMN "version__status" SET DEFAULT 'draft';
    ALTER TABLE "events_locales"
      ALTER COLUMN "_status" DROP DEFAULT,
      ALTER COLUMN "_status" SET DATA TYPE "enum_events_status"
      USING "_status"::text::"enum_events_status",
      ALTER COLUMN "_status" SET DEFAULT 'draft';
    ALTER TABLE "_events_v_locales"
      ALTER COLUMN "version__status" DROP DEFAULT,
      ALTER COLUMN "version__status" SET DATA TYPE "enum__events_v_version_status"
      USING "version__status"::text::"enum__events_v_version_status",
      ALTER COLUMN "version__status" SET DEFAULT 'draft';
    ALTER TABLE "people_locales"
      ALTER COLUMN "_status" DROP DEFAULT,
      ALTER COLUMN "_status" SET DATA TYPE "enum_people_status"
      USING "_status"::text::"enum_people_status",
      ALTER COLUMN "_status" SET DEFAULT 'draft';
    ALTER TABLE "_people_v_locales"
      ALTER COLUMN "version__status" DROP DEFAULT,
      ALTER COLUMN "version__status" SET DATA TYPE "enum__people_v_version_status"
      USING "version__status"::text::"enum__people_v_version_status",
      ALTER COLUMN "version__status" SET DEFAULT 'draft';
    ALTER TABLE "literary_works_locales"
      ALTER COLUMN "_status" DROP DEFAULT,
      ALTER COLUMN "_status" SET DATA TYPE "enum_literary_works_status"
      USING "_status"::text::"enum_literary_works_status",
      ALTER COLUMN "_status" SET DEFAULT 'draft';
    ALTER TABLE "_literary_works_v_locales"
      ALTER COLUMN "version__status" DROP DEFAULT,
      ALTER COLUMN "version__status" SET DATA TYPE "enum__literary_works_v_version_status"
      USING "version__status"::text::"enum__literary_works_v_version_status",
      ALTER COLUMN "version__status" SET DEFAULT 'draft';
    ALTER TABLE "homepage_locales"
      ALTER COLUMN "_status" DROP DEFAULT,
      ALTER COLUMN "_status" SET DATA TYPE "enum_homepage_status"
      USING "_status"::text::"enum_homepage_status",
      ALTER COLUMN "_status" SET DEFAULT 'draft';
    ALTER TABLE "_homepage_v_locales"
      ALTER COLUMN "version__status" DROP DEFAULT,
      ALTER COLUMN "version__status" SET DATA TYPE "enum__homepage_v_version_status"
      USING "version__status"::text::"enum__homepage_v_version_status",
      ALTER COLUMN "version__status" SET DEFAULT 'draft';

    ALTER TABLE "media" ADD COLUMN "internal_seed_key" varchar;
    CREATE UNIQUE INDEX "media_internal_seed_key_idx"
      ON "media" USING btree ("internal_seed_key");

    CREATE INDEX "event_series__status_idx"
      ON "event_series_locales" USING btree ("_status", "_locale");
    CREATE INDEX "_event_series_v_version_version__status_idx"
      ON "_event_series_v_locales" USING btree ("version__status", "_locale");
    CREATE INDEX "events__status_idx"
      ON "events_locales" USING btree ("_status", "_locale");
    CREATE INDEX "_events_v_version_version__status_idx"
      ON "_events_v_locales" USING btree ("version__status", "_locale");
    CREATE INDEX "people__status_idx"
      ON "people_locales" USING btree ("_status", "_locale");
    CREATE INDEX "_people_v_version_version__status_idx"
      ON "_people_v_locales" USING btree ("version__status", "_locale");
    CREATE INDEX "literary_works__status_idx"
      ON "literary_works_locales" USING btree ("_status", "_locale");
    CREATE INDEX "_literary_works_v_version_version__status_idx"
      ON "_literary_works_v_locales" USING btree ("version__status", "_locale");
    CREATE INDEX "homepage__status_idx"
      ON "homepage_locales" USING btree ("_status", "_locale");
    CREATE INDEX "_homepage_v_version_version__status_idx"
      ON "_homepage_v_locales" USING btree ("version__status", "_locale");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // A rollback collapses the status back to the default Arabic locale. This
  // intentionally mirrors Payload's pre-localized status model.
  await db.execute(sql`
    DROP INDEX IF EXISTS "media_internal_seed_key_idx";
    DROP INDEX IF EXISTS "event_series__status_idx";
    DROP INDEX IF EXISTS "_event_series_v_version_version__status_idx";
    DROP INDEX IF EXISTS "events__status_idx";
    DROP INDEX IF EXISTS "_events_v_version_version__status_idx";
    DROP INDEX IF EXISTS "people__status_idx";
    DROP INDEX IF EXISTS "_people_v_version_version__status_idx";
    DROP INDEX IF EXISTS "literary_works__status_idx";
    DROP INDEX IF EXISTS "_literary_works_v_version_version__status_idx";
    DROP INDEX IF EXISTS "homepage__status_idx";
    DROP INDEX IF EXISTS "_homepage_v_version_version__status_idx";

    ALTER TABLE "event_series" ADD COLUMN "_status" "enum_event_series_status" DEFAULT 'draft';
    ALTER TABLE "_event_series_v" ADD COLUMN "version__status" "enum__event_series_v_version_status" DEFAULT 'draft';
    ALTER TABLE "events" ADD COLUMN "_status" "enum_events_status" DEFAULT 'draft';
    ALTER TABLE "_events_v" ADD COLUMN "version__status" "enum__events_v_version_status" DEFAULT 'draft';
    ALTER TABLE "people" ADD COLUMN "_status" "enum_people_status" DEFAULT 'draft';
    ALTER TABLE "_people_v" ADD COLUMN "version__status" "enum__people_v_version_status" DEFAULT 'draft';
    ALTER TABLE "literary_works" ADD COLUMN "_status" "enum_literary_works_status" DEFAULT 'draft';
    ALTER TABLE "_literary_works_v" ADD COLUMN "version__status" "enum__literary_works_v_version_status" DEFAULT 'draft';
    ALTER TABLE "homepage" ADD COLUMN "_status" "enum_homepage_status" DEFAULT 'draft';
    ALTER TABLE "_homepage_v" ADD COLUMN "version__status" "enum__homepage_v_version_status" DEFAULT 'draft';

    UPDATE "event_series" AS main
      SET "_status" = locale."_status"::text::"enum_event_series_status"
      FROM "event_series_locales" AS locale
      WHERE main."id" = locale."_parent_id" AND locale."_locale" = 'ar';
    UPDATE "_event_series_v" AS main
      SET "version__status" = locale."version__status"::text::"enum__event_series_v_version_status"
      FROM "_event_series_v_locales" AS locale
      WHERE main."id" = locale."_parent_id" AND locale."_locale" = 'ar';

    UPDATE "events" AS main
      SET "_status" = locale."_status"::text::"enum_events_status"
      FROM "events_locales" AS locale
      WHERE main."id" = locale."_parent_id" AND locale."_locale" = 'ar';
    UPDATE "_events_v" AS main
      SET "version__status" = locale."version__status"::text::"enum__events_v_version_status"
      FROM "_events_v_locales" AS locale
      WHERE main."id" = locale."_parent_id" AND locale."_locale" = 'ar';

    UPDATE "people" AS main
      SET "_status" = locale."_status"::text::"enum_people_status"
      FROM "people_locales" AS locale
      WHERE main."id" = locale."_parent_id" AND locale."_locale" = 'ar';
    UPDATE "_people_v" AS main
      SET "version__status" = locale."version__status"::text::"enum__people_v_version_status"
      FROM "_people_v_locales" AS locale
      WHERE main."id" = locale."_parent_id" AND locale."_locale" = 'ar';

    UPDATE "literary_works" AS main
      SET "_status" = locale."_status"::text::"enum_literary_works_status"
      FROM "literary_works_locales" AS locale
      WHERE main."id" = locale."_parent_id" AND locale."_locale" = 'ar';
    UPDATE "_literary_works_v" AS main
      SET "version__status" = locale."version__status"::text::"enum__literary_works_v_version_status"
      FROM "_literary_works_v_locales" AS locale
      WHERE main."id" = locale."_parent_id" AND locale."_locale" = 'ar';

    UPDATE "homepage" AS main
      SET "_status" = locale."_status"::text::"enum_homepage_status"
      FROM "homepage_locales" AS locale
      WHERE main."id" = locale."_parent_id" AND locale."_locale" = 'ar';
    UPDATE "_homepage_v" AS main
      SET "version__status" = locale."version__status"::text::"enum__homepage_v_version_status"
      FROM "_homepage_v_locales" AS locale
      WHERE main."id" = locale."_parent_id" AND locale."_locale" = 'ar';

    ALTER TABLE "event_series_locales" DROP COLUMN "_status";
    ALTER TABLE "_event_series_v_locales" DROP COLUMN "version__status";
    ALTER TABLE "events_locales" DROP COLUMN "_status";
    ALTER TABLE "_events_v_locales" DROP COLUMN "version__status";
    ALTER TABLE "people_locales" DROP COLUMN "_status";
    ALTER TABLE "_people_v_locales" DROP COLUMN "version__status";
    ALTER TABLE "literary_works_locales" DROP COLUMN "_status";
    ALTER TABLE "_literary_works_v_locales" DROP COLUMN "version__status";
    ALTER TABLE "homepage_locales" DROP COLUMN "_status";
    ALTER TABLE "_homepage_v_locales" DROP COLUMN "version__status";

    CREATE INDEX "event_series__status_idx" ON "event_series" USING btree ("_status");
    CREATE INDEX "_event_series_v_version_version__status_idx" ON "_event_series_v" USING btree ("version__status");
    CREATE INDEX "events__status_idx" ON "events" USING btree ("_status");
    CREATE INDEX "_events_v_version_version__status_idx" ON "_events_v" USING btree ("version__status");
    CREATE INDEX "people__status_idx" ON "people" USING btree ("_status");
    CREATE INDEX "_people_v_version_version__status_idx" ON "_people_v" USING btree ("version__status");
    CREATE INDEX "literary_works__status_idx" ON "literary_works" USING btree ("_status");
    CREATE INDEX "_literary_works_v_version_version__status_idx" ON "_literary_works_v" USING btree ("version__status");
    CREATE INDEX "homepage__status_idx" ON "homepage" USING btree ("_status");
    CREATE INDEX "_homepage_v_version_version__status_idx" ON "_homepage_v" USING btree ("version__status");

    ALTER TABLE "media" DROP COLUMN "internal_seed_key";
  `)
}
