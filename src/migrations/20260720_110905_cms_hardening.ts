import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_events_timezone" AS ENUM('Asia/Gaza', 'Asia/Hebron', 'Europe/Istanbul', 'Asia/Amman', 'Africa/Cairo', 'Asia/Riyadh', 'Asia/Dubai', 'UTC');
  CREATE TYPE "public"."enum__events_v_version_timezone" AS ENUM('Asia/Gaza', 'Asia/Hebron', 'Europe/Istanbul', 'Asia/Amman', 'Africa/Cairo', 'Asia/Riyadh', 'Asia/Dubai', 'UTC');
  ALTER TABLE "media_locales" ALTER COLUMN "alt" SET NOT NULL;
  ALTER TABLE "events" ALTER COLUMN "timezone" SET DEFAULT 'Asia/Gaza'::"public"."enum_events_timezone";
  ALTER TABLE "events" ALTER COLUMN "timezone" SET DATA TYPE "public"."enum_events_timezone" USING "timezone"::"public"."enum_events_timezone";
  ALTER TABLE "events" ALTER COLUMN "attendance_mode" SET DEFAULT 'open';
  ALTER TABLE "_events_v" ALTER COLUMN "version_timezone" SET DEFAULT 'Asia/Gaza'::"public"."enum__events_v_version_timezone";
  ALTER TABLE "_events_v" ALTER COLUMN "version_timezone" SET DATA TYPE "public"."enum__events_v_version_timezone" USING "version_timezone"::"public"."enum__events_v_version_timezone";
  ALTER TABLE "_events_v" ALTER COLUMN "version_attendance_mode" SET DEFAULT 'open';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media_locales" ALTER COLUMN "alt" DROP NOT NULL;
  ALTER TABLE "events" ALTER COLUMN "timezone" SET DATA TYPE varchar;
  ALTER TABLE "events" ALTER COLUMN "timezone" SET DEFAULT 'Europe/Istanbul';
  ALTER TABLE "events" ALTER COLUMN "attendance_mode" DROP DEFAULT;
  ALTER TABLE "_events_v" ALTER COLUMN "version_timezone" SET DATA TYPE varchar;
  ALTER TABLE "_events_v" ALTER COLUMN "version_timezone" SET DEFAULT 'Europe/Istanbul';
  ALTER TABLE "_events_v" ALTER COLUMN "version_attendance_mode" DROP DEFAULT;
  DROP TYPE "public"."enum_events_timezone";
  DROP TYPE "public"."enum__events_v_version_timezone";`)
}
