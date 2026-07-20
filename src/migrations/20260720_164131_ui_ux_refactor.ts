import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "homepage_statistics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "homepage_statistics_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_homepage_v_version_statistics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_version_statistics_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "event_types" ADD COLUMN "calendar_color" varchar DEFAULT '#B88A2C';
  ALTER TABLE "event_types" ADD COLUMN "show_in_calendar_legend" boolean DEFAULT true;
  ALTER TABLE "homepage_statistics" ADD CONSTRAINT "homepage_statistics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_statistics_locales" ADD CONSTRAINT "homepage_statistics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_statistics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_statistics" ADD CONSTRAINT "_homepage_v_version_statistics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_statistics_locales" ADD CONSTRAINT "_homepage_v_version_statistics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_version_statistics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "homepage_statistics_order_idx" ON "homepage_statistics" USING btree ("_order");
  CREATE INDEX "homepage_statistics_parent_id_idx" ON "homepage_statistics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_statistics_locales_locale_parent_id_unique" ON "homepage_statistics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_version_statistics_order_idx" ON "_homepage_v_version_statistics" USING btree ("_order");
  CREATE INDEX "_homepage_v_version_statistics_parent_id_idx" ON "_homepage_v_version_statistics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_homepage_v_version_statistics_locales_locale_parent_id_uniq" ON "_homepage_v_version_statistics_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "homepage_statistics" CASCADE;
  DROP TABLE "homepage_statistics_locales" CASCADE;
  DROP TABLE "_homepage_v_version_statistics" CASCADE;
  DROP TABLE "_homepage_v_version_statistics_locales" CASCADE;
  ALTER TABLE "event_types" DROP COLUMN "calendar_color";
  ALTER TABLE "event_types" DROP COLUMN "show_in_calendar_legend";`)
}
