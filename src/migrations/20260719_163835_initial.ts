import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  CREATE TYPE "public"."enum_event_series_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__event_series_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__event_series_v_published_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_events_participants_event_role" AS ENUM('poet', 'presenter', 'guest', 'judge', 'honoree', 'organizer', 'other');
  CREATE TYPE "public"."enum_events_attendance_mode" AS ENUM('open', 'invitation', 'requestApproval');
  CREATE TYPE "public"."enum_events_program_mode" AS ENUM('single', 'perDay', 'sharedAcrossDays');
  CREATE TYPE "public"."enum_events_archive_verification_status" AS ENUM('unverified', 'needsReview', 'verified', 'approvedWithGaps');
  CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__events_v_version_participants_event_role" AS ENUM('poet', 'presenter', 'guest', 'judge', 'honoree', 'organizer', 'other');
  CREATE TYPE "public"."enum__events_v_version_attendance_mode" AS ENUM('open', 'invitation', 'requestApproval');
  CREATE TYPE "public"."enum__events_v_version_program_mode" AS ENUM('single', 'perDay', 'sharedAcrossDays');
  CREATE TYPE "public"."enum__events_v_version_archive_verification_status" AS ENUM('unverified', 'needsReview', 'verified', 'approvedWithGaps');
  CREATE TYPE "public"."enum__events_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__events_v_published_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_people_roles" AS ENUM('poet', 'writer', 'critic', 'artist', 'media', 'presenter', 'guest', 'boardMember', 'teamMember', 'judge', 'honoree');
  CREATE TYPE "public"."enum_people_social_links_platform" AS ENUM('facebook', 'instagram', 'youtube', 'x', 'other');
  CREATE TYPE "public"."enum_people_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__people_v_version_roles" AS ENUM('poet', 'writer', 'critic', 'artist', 'media', 'presenter', 'guest', 'boardMember', 'teamMember', 'judge', 'honoree');
  CREATE TYPE "public"."enum__people_v_version_social_links_platform" AS ENUM('facebook', 'instagram', 'youtube', 'x', 'other');
  CREATE TYPE "public"."enum__people_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__people_v_published_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_literary_works_type" AS ENUM('poetryCollection', 'book', 'poem', 'article', 'audio', 'recitationVideo', 'interview', 'other');
  CREATE TYPE "public"."enum_literary_works_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__literary_works_v_version_type" AS ENUM('poetryCollection', 'book', 'poem', 'article', 'audio', 'recitationVideo', 'interview', 'other');
  CREATE TYPE "public"."enum__literary_works_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__literary_works_v_published_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_partners_relationship_type" AS ENUM('partner', 'sponsor', 'organizer', 'supporter', 'media');
  CREATE TYPE "public"."enum_participation_requests_participation_type" AS ENUM('poet', 'writer', 'artist', 'media', 'other');
  CREATE TYPE "public"."enum_participation_requests_status" AS ENUM('new', 'reviewed', 'contacted', 'closed', 'spam');
  CREATE TYPE "public"."enum_contact_messages_status" AS ENUM('new', 'read', 'contacted', 'closed', 'spam');
  CREATE TYPE "public"."enum_site_settings_social_links_platform" AS ENUM('facebook', 'instagram', 'youtube', 'x', 'other');
  CREATE TYPE "public"."enum_homepage_hero_mode" AS ENUM('automatic', 'featuredEvent', 'institutional');
  CREATE TYPE "public"."enum_homepage_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__homepage_v_version_hero_mode" AS ENUM('automatic', 'featuredEvent', 'institutional');
  CREATE TYPE "public"."enum__homepage_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__homepage_v_published_locale" AS ENUM('ar', 'en');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"credit" varchar,
  	"source_event_id" integer,
  	"cloudinary_public_id" varchar,
  	"cloudinary_secure_url" varchar,
  	"cloudinary_asset_id" varchar,
  	"cloudinary_version" numeric,
  	"prefix" varchar DEFAULT 'media',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar,
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "event_types" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"is_active" boolean DEFAULT true NOT NULL,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "event_types_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "event_series" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"logo_id" integer,
  	"cover_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_event_series_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "event_series_locales" (
  	"name" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_event_series_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_logo_id" integer,
  	"version_cover_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__event_series_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__event_series_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_event_series_v_locales" (
  	"version_name" varchar,
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "countries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"is_active" boolean DEFAULT true NOT NULL,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "countries_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "cities" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"country_id" integer NOT NULL,
  	"is_active" boolean DEFAULT true NOT NULL,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cities_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "events_participants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"person_id" integer,
  	"event_role" "enum_events_participants_event_role",
  	"is_featured" boolean DEFAULT false,
  	"order" numeric DEFAULT 0
  );
  
  CREATE TABLE "events_participants_locales" (
  	"custom_role_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "events_program_days_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start_time" varchar,
  	"duration_minutes" numeric,
  	"presenter_id" integer,
  	"image_id" integer
  );
  
  CREATE TABLE "events_program_days_items_locales" (
  	"title" varchar,
  	"description" varchar,
  	"venue" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "events_program_days" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone
  );
  
  CREATE TABLE "events_program_days_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"event_type_id" integer,
  	"series_id" integer,
  	"edition_number" numeric,
  	"featured_on_homepage" boolean DEFAULT false,
  	"start_date_time" timestamp(3) with time zone,
  	"end_date_time" timestamp(3) with time zone,
  	"timezone" varchar DEFAULT 'Europe/Istanbul',
  	"country_id" integer,
  	"city_id" integer,
  	"attendance_mode" "enum_events_attendance_mode",
  	"cover_image_id" integer,
  	"social_image_id" integer,
  	"poster_image_id" integer,
  	"youtube_url" varchar,
  	"program_mode" "enum_events_program_mode" DEFAULT 'single',
  	"archive_source_facebook_url" varchar,
  	"archive_verification_status" "enum_events_archive_verification_status" DEFAULT 'unverified',
  	"archive_verification_notes" varchar,
  	"archive_verified_by_id" integer,
  	"archive_verified_at" timestamp(3) with time zone,
  	"seo_custom_og_image_id" integer,
  	"seo_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_events_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "events_locales" (
  	"title" varchar,
  	"edition_name" varchar,
  	"short_description" varchar,
  	"full_description" jsonb,
  	"venue_name" varchar,
  	"address_text" varchar,
  	"attendance_note" varchar,
  	"closing_report" jsonb,
  	"recommendations" jsonb,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "events_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"people_id" integer,
  	"events_id" integer
  );
  
  CREATE TABLE "_events_v_version_participants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"person_id" integer,
  	"event_role" "enum__events_v_version_participants_event_role",
  	"is_featured" boolean DEFAULT false,
  	"order" numeric DEFAULT 0,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_events_v_version_participants_locales" (
  	"custom_role_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_events_v_version_program_days_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"start_time" varchar,
  	"duration_minutes" numeric,
  	"presenter_id" integer,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_events_v_version_program_days_items_locales" (
  	"title" varchar,
  	"description" varchar,
  	"venue" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_events_v_version_program_days" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_events_v_version_program_days_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_events_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_event_type_id" integer,
  	"version_series_id" integer,
  	"version_edition_number" numeric,
  	"version_featured_on_homepage" boolean DEFAULT false,
  	"version_start_date_time" timestamp(3) with time zone,
  	"version_end_date_time" timestamp(3) with time zone,
  	"version_timezone" varchar DEFAULT 'Europe/Istanbul',
  	"version_country_id" integer,
  	"version_city_id" integer,
  	"version_attendance_mode" "enum__events_v_version_attendance_mode",
  	"version_cover_image_id" integer,
  	"version_social_image_id" integer,
  	"version_poster_image_id" integer,
  	"version_youtube_url" varchar,
  	"version_program_mode" "enum__events_v_version_program_mode" DEFAULT 'single',
  	"version_archive_source_facebook_url" varchar,
  	"version_archive_verification_status" "enum__events_v_version_archive_verification_status" DEFAULT 'unverified',
  	"version_archive_verification_notes" varchar,
  	"version_archive_verified_by_id" integer,
  	"version_archive_verified_at" timestamp(3) with time zone,
  	"version_seo_custom_og_image_id" integer,
  	"version_seo_no_index" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__events_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__events_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_events_v_locales" (
  	"version_title" varchar,
  	"version_edition_name" varchar,
  	"version_short_description" varchar,
  	"version_full_description" jsonb,
  	"version_venue_name" varchar,
  	"version_address_text" varchar,
  	"version_attendance_note" varchar,
  	"version_closing_report" jsonb,
  	"version_recommendations" jsonb,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_events_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"people_id" integer,
  	"events_id" integer
  );
  
  CREATE TABLE "people_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_people_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "people_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_people_social_links_platform",
  	"url" varchar
  );
  
  CREATE TABLE "people" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"country_id" integer,
  	"city_id" integer,
  	"profile_image_id" integer,
  	"website" varchar,
  	"email" varchar,
  	"phone" varchar,
  	"show_contact_publicly" boolean DEFAULT false,
  	"show_in_public_directory" boolean DEFAULT false,
  	"display_order" numeric DEFAULT 0,
  	"seo_custom_og_image_id" integer,
  	"seo_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_people_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "people_locales" (
  	"name" varchar,
  	"pen_name" varchar,
  	"short_bio" varchar,
  	"full_bio" jsonb,
  	"profession" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_people_v_version_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__people_v_version_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_people_v_version_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"platform" "enum__people_v_version_social_links_platform",
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_people_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_country_id" integer,
  	"version_city_id" integer,
  	"version_profile_image_id" integer,
  	"version_website" varchar,
  	"version_email" varchar,
  	"version_phone" varchar,
  	"version_show_contact_publicly" boolean DEFAULT false,
  	"version_show_in_public_directory" boolean DEFAULT false,
  	"version_display_order" numeric DEFAULT 0,
  	"version_seo_custom_og_image_id" integer,
  	"version_seo_no_index" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__people_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__people_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_people_v_locales" (
  	"version_name" varchar,
  	"version_pen_name" varchar,
  	"version_short_bio" varchar,
  	"version_full_bio" jsonb,
  	"version_profession" varchar,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "literary_works" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"person_id" integer,
  	"type" "enum_literary_works_type",
  	"cover_image_id" integer,
  	"publication_year" numeric,
  	"external_url" varchar,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_literary_works_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "literary_works_locales" (
  	"title" varchar,
  	"publisher" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_literary_works_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_person_id" integer,
  	"version_type" "enum__literary_works_v_version_type",
  	"version_cover_image_id" integer,
  	"version_publication_year" numeric,
  	"version_external_url" varchar,
  	"version_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__literary_works_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__literary_works_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_literary_works_v_locales" (
  	"version_title" varchar,
  	"version_publisher" varchar,
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "partners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"logo_id" integer,
  	"website" varchar,
  	"relationship_type" "enum_partners_relationship_type" NOT NULL,
  	"association_wide" boolean DEFAULT true NOT NULL,
  	"is_active" boolean DEFAULT true NOT NULL,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "partners_locales" (
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "partners_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"events_id" integer
  );
  
  CREATE TABLE "participation_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"full_name" varchar NOT NULL,
  	"country" varchar NOT NULL,
  	"city" varchar,
  	"email" varchar NOT NULL,
  	"whatsapp" varchar NOT NULL,
  	"short_bio" varchar,
  	"participation_type" "enum_participation_requests_participation_type" NOT NULL,
  	"requested_event_id" integer,
  	"external_url" varchar,
  	"message" varchar,
  	"consent" boolean DEFAULT false NOT NULL,
  	"status" "enum_participation_requests_status" DEFAULT 'new' NOT NULL,
  	"internal_notes" varchar,
  	"submitted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contact_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone_or_whatsapp" varchar,
  	"subject" varchar,
  	"message" varchar NOT NULL,
  	"consent" boolean DEFAULT false NOT NULL,
  	"status" "enum_contact_messages_status" DEFAULT 'new' NOT NULL,
  	"internal_notes" varchar,
  	"submitted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"event_types_id" integer,
  	"event_series_id" integer,
  	"countries_id" integer,
  	"cities_id" integer,
  	"events_id" integer,
  	"people_id" integer,
  	"literary_works_id" integer,
  	"partners_id" integer,
  	"participation_requests_id" integer,
  	"contact_messages_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_site_settings_social_links_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"default_social_image_id" integer,
  	"official_email" varchar NOT NULL,
  	"whatsapp" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_locales" (
  	"association_name" varchar NOT NULL,
  	"slogan" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_mode" "enum_homepage_hero_mode" DEFAULT 'automatic',
  	"featured_event_id" integer,
  	"institutional_hero_image_id" integer,
  	"show_news" boolean DEFAULT false,
  	"_status" "enum_homepage_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "homepage_locales" (
  	"institutional_hero_title" varchar,
  	"institutional_hero_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "homepage_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "_homepage_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_mode" "enum__homepage_v_version_hero_mode" DEFAULT 'automatic',
  	"version_featured_event_id" integer,
  	"version_institutional_hero_image_id" integer,
  	"version_show_news" boolean DEFAULT false,
  	"version__status" "enum__homepage_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__homepage_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_homepage_v_locales" (
  	"version_institutional_hero_title" varchar,
  	"version_institutional_hero_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer,
  	"partners_id" integer
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_source_event_id_events_id_fk" FOREIGN KEY ("source_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_types_locales" ADD CONSTRAINT "event_types_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_series" ADD CONSTRAINT "event_series_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "event_series" ADD CONSTRAINT "event_series_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "event_series_locales" ADD CONSTRAINT "event_series_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_series"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_event_series_v" ADD CONSTRAINT "_event_series_v_parent_id_event_series_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."event_series"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_event_series_v" ADD CONSTRAINT "_event_series_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_event_series_v" ADD CONSTRAINT "_event_series_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_event_series_v_locales" ADD CONSTRAINT "_event_series_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_event_series_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "countries_locales" ADD CONSTRAINT "countries_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cities_locales" ADD CONSTRAINT "cities_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_participants" ADD CONSTRAINT "events_participants_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_participants" ADD CONSTRAINT "events_participants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_participants_locales" ADD CONSTRAINT "events_participants_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_participants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_program_days_items" ADD CONSTRAINT "events_program_days_items_presenter_id_people_id_fk" FOREIGN KEY ("presenter_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_program_days_items" ADD CONSTRAINT "events_program_days_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_program_days_items" ADD CONSTRAINT "events_program_days_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_program_days"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_program_days_items_locales" ADD CONSTRAINT "events_program_days_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_program_days_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_program_days" ADD CONSTRAINT "events_program_days_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_program_days_locales" ADD CONSTRAINT "events_program_days_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_program_days"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_event_type_id_event_types_id_fk" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_series_id_event_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."event_series"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_social_image_id_media_id_fk" FOREIGN KEY ("social_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_poster_image_id_media_id_fk" FOREIGN KEY ("poster_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_archive_verified_by_id_users_id_fk" FOREIGN KEY ("archive_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_seo_custom_og_image_id_media_id_fk" FOREIGN KEY ("seo_custom_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_locales" ADD CONSTRAINT "events_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_participants" ADD CONSTRAINT "_events_v_version_participants_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v_version_participants" ADD CONSTRAINT "_events_v_version_participants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_participants_locales" ADD CONSTRAINT "_events_v_version_participants_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v_version_participants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_program_days_items" ADD CONSTRAINT "_events_v_version_program_days_items_presenter_id_people_id_fk" FOREIGN KEY ("presenter_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v_version_program_days_items" ADD CONSTRAINT "_events_v_version_program_days_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v_version_program_days_items" ADD CONSTRAINT "_events_v_version_program_days_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v_version_program_days"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_program_days_items_locales" ADD CONSTRAINT "_events_v_version_program_days_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v_version_program_days_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_program_days" ADD CONSTRAINT "_events_v_version_program_days_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_program_days_locales" ADD CONSTRAINT "_events_v_version_program_days_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v_version_program_days"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_parent_id_events_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_event_type_id_event_types_id_fk" FOREIGN KEY ("version_event_type_id") REFERENCES "public"."event_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_series_id_event_series_id_fk" FOREIGN KEY ("version_series_id") REFERENCES "public"."event_series"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_country_id_countries_id_fk" FOREIGN KEY ("version_country_id") REFERENCES "public"."countries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_city_id_cities_id_fk" FOREIGN KEY ("version_city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_social_image_id_media_id_fk" FOREIGN KEY ("version_social_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_poster_image_id_media_id_fk" FOREIGN KEY ("version_poster_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_archive_verified_by_id_users_id_fk" FOREIGN KEY ("version_archive_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_seo_custom_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_custom_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v_locales" ADD CONSTRAINT "_events_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_rels" ADD CONSTRAINT "_events_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_rels" ADD CONSTRAINT "_events_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_rels" ADD CONSTRAINT "_events_v_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_rels" ADD CONSTRAINT "_events_v_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "people_roles" ADD CONSTRAINT "people_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "people_social_links" ADD CONSTRAINT "people_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "people" ADD CONSTRAINT "people_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "people" ADD CONSTRAINT "people_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "people" ADD CONSTRAINT "people_profile_image_id_media_id_fk" FOREIGN KEY ("profile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "people" ADD CONSTRAINT "people_seo_custom_og_image_id_media_id_fk" FOREIGN KEY ("seo_custom_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "people_locales" ADD CONSTRAINT "people_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_people_v_version_roles" ADD CONSTRAINT "_people_v_version_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_people_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_people_v_version_social_links" ADD CONSTRAINT "_people_v_version_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_people_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_people_v" ADD CONSTRAINT "_people_v_parent_id_people_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_people_v" ADD CONSTRAINT "_people_v_version_country_id_countries_id_fk" FOREIGN KEY ("version_country_id") REFERENCES "public"."countries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_people_v" ADD CONSTRAINT "_people_v_version_city_id_cities_id_fk" FOREIGN KEY ("version_city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_people_v" ADD CONSTRAINT "_people_v_version_profile_image_id_media_id_fk" FOREIGN KEY ("version_profile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_people_v" ADD CONSTRAINT "_people_v_version_seo_custom_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_custom_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_people_v_locales" ADD CONSTRAINT "_people_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_people_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "literary_works" ADD CONSTRAINT "literary_works_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "literary_works" ADD CONSTRAINT "literary_works_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "literary_works_locales" ADD CONSTRAINT "literary_works_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."literary_works"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_literary_works_v" ADD CONSTRAINT "_literary_works_v_parent_id_literary_works_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."literary_works"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_literary_works_v" ADD CONSTRAINT "_literary_works_v_version_person_id_people_id_fk" FOREIGN KEY ("version_person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_literary_works_v" ADD CONSTRAINT "_literary_works_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_literary_works_v_locales" ADD CONSTRAINT "_literary_works_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_literary_works_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners" ADD CONSTRAINT "partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_locales" ADD CONSTRAINT "partners_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "participation_requests" ADD CONSTRAINT "participation_requests_requested_event_id_events_id_fk" FOREIGN KEY ("requested_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_event_types_fk" FOREIGN KEY ("event_types_id") REFERENCES "public"."event_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_event_series_fk" FOREIGN KEY ("event_series_id") REFERENCES "public"."event_series"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_countries_fk" FOREIGN KEY ("countries_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cities_fk" FOREIGN KEY ("cities_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_literary_works_fk" FOREIGN KEY ("literary_works_id") REFERENCES "public"."literary_works"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_participation_requests_fk" FOREIGN KEY ("participation_requests_id") REFERENCES "public"."participation_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_messages_fk" FOREIGN KEY ("contact_messages_id") REFERENCES "public"."contact_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_social_links" ADD CONSTRAINT "site_settings_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_default_social_image_id_media_id_fk" FOREIGN KEY ("default_social_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_featured_event_id_events_id_fk" FOREIGN KEY ("featured_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_institutional_hero_image_id_media_id_fk" FOREIGN KEY ("institutional_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_featured_event_id_events_id_fk" FOREIGN KEY ("version_featured_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_institutional_hero_image_id_media_id_fk" FOREIGN KEY ("version_institutional_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_locales" ADD CONSTRAINT "_homepage_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_source_event_idx" ON "media" USING btree ("source_event_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "event_types_slug_idx" ON "event_types" USING btree ("slug");
  CREATE INDEX "event_types_updated_at_idx" ON "event_types" USING btree ("updated_at");
  CREATE INDEX "event_types_created_at_idx" ON "event_types" USING btree ("created_at");
  CREATE INDEX "event_types_name_idx" ON "event_types_locales" USING btree ("name","_locale");
  CREATE UNIQUE INDEX "event_types_locales_locale_parent_id_unique" ON "event_types_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "event_series_slug_idx" ON "event_series" USING btree ("slug");
  CREATE INDEX "event_series_logo_idx" ON "event_series" USING btree ("logo_id");
  CREATE INDEX "event_series_cover_image_idx" ON "event_series" USING btree ("cover_image_id");
  CREATE INDEX "event_series_updated_at_idx" ON "event_series" USING btree ("updated_at");
  CREATE INDEX "event_series_created_at_idx" ON "event_series" USING btree ("created_at");
  CREATE INDEX "event_series__status_idx" ON "event_series" USING btree ("_status");
  CREATE UNIQUE INDEX "event_series_locales_locale_parent_id_unique" ON "event_series_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_event_series_v_parent_idx" ON "_event_series_v" USING btree ("parent_id");
  CREATE INDEX "_event_series_v_version_version_slug_idx" ON "_event_series_v" USING btree ("version_slug");
  CREATE INDEX "_event_series_v_version_version_logo_idx" ON "_event_series_v" USING btree ("version_logo_id");
  CREATE INDEX "_event_series_v_version_version_cover_image_idx" ON "_event_series_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_event_series_v_version_version_updated_at_idx" ON "_event_series_v" USING btree ("version_updated_at");
  CREATE INDEX "_event_series_v_version_version_created_at_idx" ON "_event_series_v" USING btree ("version_created_at");
  CREATE INDEX "_event_series_v_version_version__status_idx" ON "_event_series_v" USING btree ("version__status");
  CREATE INDEX "_event_series_v_created_at_idx" ON "_event_series_v" USING btree ("created_at");
  CREATE INDEX "_event_series_v_updated_at_idx" ON "_event_series_v" USING btree ("updated_at");
  CREATE INDEX "_event_series_v_snapshot_idx" ON "_event_series_v" USING btree ("snapshot");
  CREATE INDEX "_event_series_v_published_locale_idx" ON "_event_series_v" USING btree ("published_locale");
  CREATE INDEX "_event_series_v_latest_idx" ON "_event_series_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_event_series_v_locales_locale_parent_id_unique" ON "_event_series_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "countries_slug_idx" ON "countries" USING btree ("slug");
  CREATE INDEX "countries_updated_at_idx" ON "countries" USING btree ("updated_at");
  CREATE INDEX "countries_created_at_idx" ON "countries" USING btree ("created_at");
  CREATE INDEX "countries_name_idx" ON "countries_locales" USING btree ("name","_locale");
  CREATE UNIQUE INDEX "countries_locales_locale_parent_id_unique" ON "countries_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "cities_slug_idx" ON "cities" USING btree ("slug");
  CREATE INDEX "cities_country_idx" ON "cities" USING btree ("country_id");
  CREATE INDEX "cities_updated_at_idx" ON "cities" USING btree ("updated_at");
  CREATE INDEX "cities_created_at_idx" ON "cities" USING btree ("created_at");
  CREATE INDEX "cities_name_idx" ON "cities_locales" USING btree ("name","_locale");
  CREATE UNIQUE INDEX "cities_locales_locale_parent_id_unique" ON "cities_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "events_participants_order_idx" ON "events_participants" USING btree ("_order");
  CREATE INDEX "events_participants_parent_id_idx" ON "events_participants" USING btree ("_parent_id");
  CREATE INDEX "events_participants_person_idx" ON "events_participants" USING btree ("person_id");
  CREATE UNIQUE INDEX "events_participants_locales_locale_parent_id_unique" ON "events_participants_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "events_program_days_items_order_idx" ON "events_program_days_items" USING btree ("_order");
  CREATE INDEX "events_program_days_items_parent_id_idx" ON "events_program_days_items" USING btree ("_parent_id");
  CREATE INDEX "events_program_days_items_presenter_idx" ON "events_program_days_items" USING btree ("presenter_id");
  CREATE INDEX "events_program_days_items_image_idx" ON "events_program_days_items" USING btree ("image_id");
  CREATE UNIQUE INDEX "events_program_days_items_locales_locale_parent_id_unique" ON "events_program_days_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "events_program_days_order_idx" ON "events_program_days" USING btree ("_order");
  CREATE INDEX "events_program_days_parent_id_idx" ON "events_program_days" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "events_program_days_locales_locale_parent_id_unique" ON "events_program_days_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_event_type_idx" ON "events" USING btree ("event_type_id");
  CREATE INDEX "events_series_idx" ON "events" USING btree ("series_id");
  CREATE INDEX "events_featured_on_homepage_idx" ON "events" USING btree ("featured_on_homepage");
  CREATE INDEX "events_start_date_time_idx" ON "events" USING btree ("start_date_time");
  CREATE INDEX "events_end_date_time_idx" ON "events" USING btree ("end_date_time");
  CREATE INDEX "events_country_idx" ON "events" USING btree ("country_id");
  CREATE INDEX "events_city_idx" ON "events" USING btree ("city_id");
  CREATE INDEX "events_cover_image_idx" ON "events" USING btree ("cover_image_id");
  CREATE INDEX "events_social_image_idx" ON "events" USING btree ("social_image_id");
  CREATE INDEX "events_poster_image_idx" ON "events" USING btree ("poster_image_id");
  CREATE INDEX "events_archive_archive_verified_by_idx" ON "events" USING btree ("archive_verified_by_id");
  CREATE INDEX "events_seo_seo_custom_og_image_idx" ON "events" USING btree ("seo_custom_og_image_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX "events__status_idx" ON "events" USING btree ("_status");
  CREATE INDEX "events_title_idx" ON "events_locales" USING btree ("title","_locale");
  CREATE UNIQUE INDEX "events_locales_locale_parent_id_unique" ON "events_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "events_rels_order_idx" ON "events_rels" USING btree ("order");
  CREATE INDEX "events_rels_parent_idx" ON "events_rels" USING btree ("parent_id");
  CREATE INDEX "events_rels_path_idx" ON "events_rels" USING btree ("path");
  CREATE INDEX "events_rels_media_id_idx" ON "events_rels" USING btree ("media_id");
  CREATE INDEX "events_rels_people_id_idx" ON "events_rels" USING btree ("people_id");
  CREATE INDEX "events_rels_events_id_idx" ON "events_rels" USING btree ("events_id");
  CREATE INDEX "_events_v_version_participants_order_idx" ON "_events_v_version_participants" USING btree ("_order");
  CREATE INDEX "_events_v_version_participants_parent_id_idx" ON "_events_v_version_participants" USING btree ("_parent_id");
  CREATE INDEX "_events_v_version_participants_person_idx" ON "_events_v_version_participants" USING btree ("person_id");
  CREATE UNIQUE INDEX "_events_v_version_participants_locales_locale_parent_id_uniq" ON "_events_v_version_participants_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_events_v_version_program_days_items_order_idx" ON "_events_v_version_program_days_items" USING btree ("_order");
  CREATE INDEX "_events_v_version_program_days_items_parent_id_idx" ON "_events_v_version_program_days_items" USING btree ("_parent_id");
  CREATE INDEX "_events_v_version_program_days_items_presenter_idx" ON "_events_v_version_program_days_items" USING btree ("presenter_id");
  CREATE INDEX "_events_v_version_program_days_items_image_idx" ON "_events_v_version_program_days_items" USING btree ("image_id");
  CREATE UNIQUE INDEX "_events_v_version_program_days_items_locales_locale_parent_i" ON "_events_v_version_program_days_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_events_v_version_program_days_order_idx" ON "_events_v_version_program_days" USING btree ("_order");
  CREATE INDEX "_events_v_version_program_days_parent_id_idx" ON "_events_v_version_program_days" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_events_v_version_program_days_locales_locale_parent_id_uniq" ON "_events_v_version_program_days_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_events_v_parent_idx" ON "_events_v" USING btree ("parent_id");
  CREATE INDEX "_events_v_version_version_slug_idx" ON "_events_v" USING btree ("version_slug");
  CREATE INDEX "_events_v_version_version_event_type_idx" ON "_events_v" USING btree ("version_event_type_id");
  CREATE INDEX "_events_v_version_version_series_idx" ON "_events_v" USING btree ("version_series_id");
  CREATE INDEX "_events_v_version_version_featured_on_homepage_idx" ON "_events_v" USING btree ("version_featured_on_homepage");
  CREATE INDEX "_events_v_version_version_start_date_time_idx" ON "_events_v" USING btree ("version_start_date_time");
  CREATE INDEX "_events_v_version_version_end_date_time_idx" ON "_events_v" USING btree ("version_end_date_time");
  CREATE INDEX "_events_v_version_version_country_idx" ON "_events_v" USING btree ("version_country_id");
  CREATE INDEX "_events_v_version_version_city_idx" ON "_events_v" USING btree ("version_city_id");
  CREATE INDEX "_events_v_version_version_cover_image_idx" ON "_events_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_events_v_version_version_social_image_idx" ON "_events_v" USING btree ("version_social_image_id");
  CREATE INDEX "_events_v_version_version_poster_image_idx" ON "_events_v" USING btree ("version_poster_image_id");
  CREATE INDEX "_events_v_version_archive_version_archive_verified_by_idx" ON "_events_v" USING btree ("version_archive_verified_by_id");
  CREATE INDEX "_events_v_version_seo_version_seo_custom_og_image_idx" ON "_events_v" USING btree ("version_seo_custom_og_image_id");
  CREATE INDEX "_events_v_version_version_updated_at_idx" ON "_events_v" USING btree ("version_updated_at");
  CREATE INDEX "_events_v_version_version_created_at_idx" ON "_events_v" USING btree ("version_created_at");
  CREATE INDEX "_events_v_version_version__status_idx" ON "_events_v" USING btree ("version__status");
  CREATE INDEX "_events_v_created_at_idx" ON "_events_v" USING btree ("created_at");
  CREATE INDEX "_events_v_updated_at_idx" ON "_events_v" USING btree ("updated_at");
  CREATE INDEX "_events_v_snapshot_idx" ON "_events_v" USING btree ("snapshot");
  CREATE INDEX "_events_v_published_locale_idx" ON "_events_v" USING btree ("published_locale");
  CREATE INDEX "_events_v_latest_idx" ON "_events_v" USING btree ("latest");
  CREATE INDEX "_events_v_autosave_idx" ON "_events_v" USING btree ("autosave");
  CREATE INDEX "_events_v_version_version_title_idx" ON "_events_v_locales" USING btree ("version_title","_locale");
  CREATE UNIQUE INDEX "_events_v_locales_locale_parent_id_unique" ON "_events_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_events_v_rels_order_idx" ON "_events_v_rels" USING btree ("order");
  CREATE INDEX "_events_v_rels_parent_idx" ON "_events_v_rels" USING btree ("parent_id");
  CREATE INDEX "_events_v_rels_path_idx" ON "_events_v_rels" USING btree ("path");
  CREATE INDEX "_events_v_rels_media_id_idx" ON "_events_v_rels" USING btree ("media_id");
  CREATE INDEX "_events_v_rels_people_id_idx" ON "_events_v_rels" USING btree ("people_id");
  CREATE INDEX "_events_v_rels_events_id_idx" ON "_events_v_rels" USING btree ("events_id");
  CREATE INDEX "people_roles_order_idx" ON "people_roles" USING btree ("order");
  CREATE INDEX "people_roles_parent_idx" ON "people_roles" USING btree ("parent_id");
  CREATE INDEX "people_social_links_order_idx" ON "people_social_links" USING btree ("_order");
  CREATE INDEX "people_social_links_parent_id_idx" ON "people_social_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "people_slug_idx" ON "people" USING btree ("slug");
  CREATE INDEX "people_country_idx" ON "people" USING btree ("country_id");
  CREATE INDEX "people_city_idx" ON "people" USING btree ("city_id");
  CREATE INDEX "people_profile_image_idx" ON "people" USING btree ("profile_image_id");
  CREATE INDEX "people_show_in_public_directory_idx" ON "people" USING btree ("show_in_public_directory");
  CREATE INDEX "people_seo_seo_custom_og_image_idx" ON "people" USING btree ("seo_custom_og_image_id");
  CREATE INDEX "people_updated_at_idx" ON "people" USING btree ("updated_at");
  CREATE INDEX "people_created_at_idx" ON "people" USING btree ("created_at");
  CREATE INDEX "people__status_idx" ON "people" USING btree ("_status");
  CREATE INDEX "people_name_idx" ON "people_locales" USING btree ("name","_locale");
  CREATE UNIQUE INDEX "people_locales_locale_parent_id_unique" ON "people_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_people_v_version_roles_order_idx" ON "_people_v_version_roles" USING btree ("order");
  CREATE INDEX "_people_v_version_roles_parent_idx" ON "_people_v_version_roles" USING btree ("parent_id");
  CREATE INDEX "_people_v_version_social_links_order_idx" ON "_people_v_version_social_links" USING btree ("_order");
  CREATE INDEX "_people_v_version_social_links_parent_id_idx" ON "_people_v_version_social_links" USING btree ("_parent_id");
  CREATE INDEX "_people_v_parent_idx" ON "_people_v" USING btree ("parent_id");
  CREATE INDEX "_people_v_version_version_slug_idx" ON "_people_v" USING btree ("version_slug");
  CREATE INDEX "_people_v_version_version_country_idx" ON "_people_v" USING btree ("version_country_id");
  CREATE INDEX "_people_v_version_version_city_idx" ON "_people_v" USING btree ("version_city_id");
  CREATE INDEX "_people_v_version_version_profile_image_idx" ON "_people_v" USING btree ("version_profile_image_id");
  CREATE INDEX "_people_v_version_version_show_in_public_directory_idx" ON "_people_v" USING btree ("version_show_in_public_directory");
  CREATE INDEX "_people_v_version_seo_version_seo_custom_og_image_idx" ON "_people_v" USING btree ("version_seo_custom_og_image_id");
  CREATE INDEX "_people_v_version_version_updated_at_idx" ON "_people_v" USING btree ("version_updated_at");
  CREATE INDEX "_people_v_version_version_created_at_idx" ON "_people_v" USING btree ("version_created_at");
  CREATE INDEX "_people_v_version_version__status_idx" ON "_people_v" USING btree ("version__status");
  CREATE INDEX "_people_v_created_at_idx" ON "_people_v" USING btree ("created_at");
  CREATE INDEX "_people_v_updated_at_idx" ON "_people_v" USING btree ("updated_at");
  CREATE INDEX "_people_v_snapshot_idx" ON "_people_v" USING btree ("snapshot");
  CREATE INDEX "_people_v_published_locale_idx" ON "_people_v" USING btree ("published_locale");
  CREATE INDEX "_people_v_latest_idx" ON "_people_v" USING btree ("latest");
  CREATE INDEX "_people_v_autosave_idx" ON "_people_v" USING btree ("autosave");
  CREATE INDEX "_people_v_version_version_name_idx" ON "_people_v_locales" USING btree ("version_name","_locale");
  CREATE UNIQUE INDEX "_people_v_locales_locale_parent_id_unique" ON "_people_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "literary_works_slug_idx" ON "literary_works" USING btree ("slug");
  CREATE INDEX "literary_works_person_idx" ON "literary_works" USING btree ("person_id");
  CREATE INDEX "literary_works_cover_image_idx" ON "literary_works" USING btree ("cover_image_id");
  CREATE INDEX "literary_works_updated_at_idx" ON "literary_works" USING btree ("updated_at");
  CREATE INDEX "literary_works_created_at_idx" ON "literary_works" USING btree ("created_at");
  CREATE INDEX "literary_works__status_idx" ON "literary_works" USING btree ("_status");
  CREATE UNIQUE INDEX "literary_works_locales_locale_parent_id_unique" ON "literary_works_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_literary_works_v_parent_idx" ON "_literary_works_v" USING btree ("parent_id");
  CREATE INDEX "_literary_works_v_version_version_slug_idx" ON "_literary_works_v" USING btree ("version_slug");
  CREATE INDEX "_literary_works_v_version_version_person_idx" ON "_literary_works_v" USING btree ("version_person_id");
  CREATE INDEX "_literary_works_v_version_version_cover_image_idx" ON "_literary_works_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_literary_works_v_version_version_updated_at_idx" ON "_literary_works_v" USING btree ("version_updated_at");
  CREATE INDEX "_literary_works_v_version_version_created_at_idx" ON "_literary_works_v" USING btree ("version_created_at");
  CREATE INDEX "_literary_works_v_version_version__status_idx" ON "_literary_works_v" USING btree ("version__status");
  CREATE INDEX "_literary_works_v_created_at_idx" ON "_literary_works_v" USING btree ("created_at");
  CREATE INDEX "_literary_works_v_updated_at_idx" ON "_literary_works_v" USING btree ("updated_at");
  CREATE INDEX "_literary_works_v_snapshot_idx" ON "_literary_works_v" USING btree ("snapshot");
  CREATE INDEX "_literary_works_v_published_locale_idx" ON "_literary_works_v" USING btree ("published_locale");
  CREATE INDEX "_literary_works_v_latest_idx" ON "_literary_works_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_literary_works_v_locales_locale_parent_id_unique" ON "_literary_works_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "partners_slug_idx" ON "partners" USING btree ("slug");
  CREATE INDEX "partners_logo_idx" ON "partners" USING btree ("logo_id");
  CREATE INDEX "partners_updated_at_idx" ON "partners" USING btree ("updated_at");
  CREATE INDEX "partners_created_at_idx" ON "partners" USING btree ("created_at");
  CREATE UNIQUE INDEX "partners_locales_locale_parent_id_unique" ON "partners_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "partners_rels_order_idx" ON "partners_rels" USING btree ("order");
  CREATE INDEX "partners_rels_parent_idx" ON "partners_rels" USING btree ("parent_id");
  CREATE INDEX "partners_rels_path_idx" ON "partners_rels" USING btree ("path");
  CREATE INDEX "partners_rels_events_id_idx" ON "partners_rels" USING btree ("events_id");
  CREATE INDEX "participation_requests_requested_event_idx" ON "participation_requests" USING btree ("requested_event_id");
  CREATE INDEX "participation_requests_updated_at_idx" ON "participation_requests" USING btree ("updated_at");
  CREATE INDEX "participation_requests_created_at_idx" ON "participation_requests" USING btree ("created_at");
  CREATE INDEX "contact_messages_updated_at_idx" ON "contact_messages" USING btree ("updated_at");
  CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_event_types_id_idx" ON "payload_locked_documents_rels" USING btree ("event_types_id");
  CREATE INDEX "payload_locked_documents_rels_event_series_id_idx" ON "payload_locked_documents_rels" USING btree ("event_series_id");
  CREATE INDEX "payload_locked_documents_rels_countries_id_idx" ON "payload_locked_documents_rels" USING btree ("countries_id");
  CREATE INDEX "payload_locked_documents_rels_cities_id_idx" ON "payload_locked_documents_rels" USING btree ("cities_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_people_id_idx" ON "payload_locked_documents_rels" USING btree ("people_id");
  CREATE INDEX "payload_locked_documents_rels_literary_works_id_idx" ON "payload_locked_documents_rels" USING btree ("literary_works_id");
  CREATE INDEX "payload_locked_documents_rels_partners_id_idx" ON "payload_locked_documents_rels" USING btree ("partners_id");
  CREATE INDEX "payload_locked_documents_rels_participation_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("participation_requests_id");
  CREATE INDEX "payload_locked_documents_rels_contact_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("contact_messages_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_social_links_order_idx" ON "site_settings_social_links" USING btree ("_order");
  CREATE INDEX "site_settings_social_links_parent_id_idx" ON "site_settings_social_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_logo_idx" ON "site_settings" USING btree ("logo_id");
  CREATE INDEX "site_settings_default_social_image_idx" ON "site_settings" USING btree ("default_social_image_id");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "site_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_featured_event_idx" ON "homepage" USING btree ("featured_event_id");
  CREATE INDEX "homepage_institutional_hero_institutional_hero_image_idx" ON "homepage" USING btree ("institutional_hero_image_id");
  CREATE INDEX "homepage__status_idx" ON "homepage" USING btree ("_status");
  CREATE UNIQUE INDEX "homepage_locales_locale_parent_id_unique" ON "homepage_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_rels_order_idx" ON "homepage_rels" USING btree ("order");
  CREATE INDEX "homepage_rels_parent_idx" ON "homepage_rels" USING btree ("parent_id");
  CREATE INDEX "homepage_rels_path_idx" ON "homepage_rels" USING btree ("path");
  CREATE INDEX "homepage_rels_people_id_idx" ON "homepage_rels" USING btree ("people_id");
  CREATE INDEX "homepage_rels_partners_id_idx" ON "homepage_rels" USING btree ("partners_id");
  CREATE INDEX "_homepage_v_version_version_featured_event_idx" ON "_homepage_v" USING btree ("version_featured_event_id");
  CREATE INDEX "_homepage_v_version_institutional_hero_version_instituti_idx" ON "_homepage_v" USING btree ("version_institutional_hero_image_id");
  CREATE INDEX "_homepage_v_version_version__status_idx" ON "_homepage_v" USING btree ("version__status");
  CREATE INDEX "_homepage_v_created_at_idx" ON "_homepage_v" USING btree ("created_at");
  CREATE INDEX "_homepage_v_updated_at_idx" ON "_homepage_v" USING btree ("updated_at");
  CREATE INDEX "_homepage_v_snapshot_idx" ON "_homepage_v" USING btree ("snapshot");
  CREATE INDEX "_homepage_v_published_locale_idx" ON "_homepage_v" USING btree ("published_locale");
  CREATE INDEX "_homepage_v_latest_idx" ON "_homepage_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_homepage_v_locales_locale_parent_id_unique" ON "_homepage_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_rels_order_idx" ON "_homepage_v_rels" USING btree ("order");
  CREATE INDEX "_homepage_v_rels_parent_idx" ON "_homepage_v_rels" USING btree ("parent_id");
  CREATE INDEX "_homepage_v_rels_path_idx" ON "_homepage_v_rels" USING btree ("path");
  CREATE INDEX "_homepage_v_rels_people_id_idx" ON "_homepage_v_rels" USING btree ("people_id");
  CREATE INDEX "_homepage_v_rels_partners_id_idx" ON "_homepage_v_rels" USING btree ("partners_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "event_types" CASCADE;
  DROP TABLE "event_types_locales" CASCADE;
  DROP TABLE "event_series" CASCADE;
  DROP TABLE "event_series_locales" CASCADE;
  DROP TABLE "_event_series_v" CASCADE;
  DROP TABLE "_event_series_v_locales" CASCADE;
  DROP TABLE "countries" CASCADE;
  DROP TABLE "countries_locales" CASCADE;
  DROP TABLE "cities" CASCADE;
  DROP TABLE "cities_locales" CASCADE;
  DROP TABLE "events_participants" CASCADE;
  DROP TABLE "events_participants_locales" CASCADE;
  DROP TABLE "events_program_days_items" CASCADE;
  DROP TABLE "events_program_days_items_locales" CASCADE;
  DROP TABLE "events_program_days" CASCADE;
  DROP TABLE "events_program_days_locales" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "events_locales" CASCADE;
  DROP TABLE "events_rels" CASCADE;
  DROP TABLE "_events_v_version_participants" CASCADE;
  DROP TABLE "_events_v_version_participants_locales" CASCADE;
  DROP TABLE "_events_v_version_program_days_items" CASCADE;
  DROP TABLE "_events_v_version_program_days_items_locales" CASCADE;
  DROP TABLE "_events_v_version_program_days" CASCADE;
  DROP TABLE "_events_v_version_program_days_locales" CASCADE;
  DROP TABLE "_events_v" CASCADE;
  DROP TABLE "_events_v_locales" CASCADE;
  DROP TABLE "_events_v_rels" CASCADE;
  DROP TABLE "people_roles" CASCADE;
  DROP TABLE "people_social_links" CASCADE;
  DROP TABLE "people" CASCADE;
  DROP TABLE "people_locales" CASCADE;
  DROP TABLE "_people_v_version_roles" CASCADE;
  DROP TABLE "_people_v_version_social_links" CASCADE;
  DROP TABLE "_people_v" CASCADE;
  DROP TABLE "_people_v_locales" CASCADE;
  DROP TABLE "literary_works" CASCADE;
  DROP TABLE "literary_works_locales" CASCADE;
  DROP TABLE "_literary_works_v" CASCADE;
  DROP TABLE "_literary_works_v_locales" CASCADE;
  DROP TABLE "partners" CASCADE;
  DROP TABLE "partners_locales" CASCADE;
  DROP TABLE "partners_rels" CASCADE;
  DROP TABLE "participation_requests" CASCADE;
  DROP TABLE "contact_messages" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings_social_links" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_locales" CASCADE;
  DROP TABLE "homepage" CASCADE;
  DROP TABLE "homepage_locales" CASCADE;
  DROP TABLE "homepage_rels" CASCADE;
  DROP TABLE "_homepage_v" CASCADE;
  DROP TABLE "_homepage_v_locales" CASCADE;
  DROP TABLE "_homepage_v_rels" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_event_series_status";
  DROP TYPE "public"."enum__event_series_v_version_status";
  DROP TYPE "public"."enum__event_series_v_published_locale";
  DROP TYPE "public"."enum_events_participants_event_role";
  DROP TYPE "public"."enum_events_attendance_mode";
  DROP TYPE "public"."enum_events_program_mode";
  DROP TYPE "public"."enum_events_archive_verification_status";
  DROP TYPE "public"."enum_events_status";
  DROP TYPE "public"."enum__events_v_version_participants_event_role";
  DROP TYPE "public"."enum__events_v_version_attendance_mode";
  DROP TYPE "public"."enum__events_v_version_program_mode";
  DROP TYPE "public"."enum__events_v_version_archive_verification_status";
  DROP TYPE "public"."enum__events_v_version_status";
  DROP TYPE "public"."enum__events_v_published_locale";
  DROP TYPE "public"."enum_people_roles";
  DROP TYPE "public"."enum_people_social_links_platform";
  DROP TYPE "public"."enum_people_status";
  DROP TYPE "public"."enum__people_v_version_roles";
  DROP TYPE "public"."enum__people_v_version_social_links_platform";
  DROP TYPE "public"."enum__people_v_version_status";
  DROP TYPE "public"."enum__people_v_published_locale";
  DROP TYPE "public"."enum_literary_works_type";
  DROP TYPE "public"."enum_literary_works_status";
  DROP TYPE "public"."enum__literary_works_v_version_type";
  DROP TYPE "public"."enum__literary_works_v_version_status";
  DROP TYPE "public"."enum__literary_works_v_published_locale";
  DROP TYPE "public"."enum_partners_relationship_type";
  DROP TYPE "public"."enum_participation_requests_participation_type";
  DROP TYPE "public"."enum_participation_requests_status";
  DROP TYPE "public"."enum_contact_messages_status";
  DROP TYPE "public"."enum_site_settings_social_links_platform";
  DROP TYPE "public"."enum_homepage_hero_mode";
  DROP TYPE "public"."enum_homepage_status";
  DROP TYPE "public"."enum__homepage_v_version_hero_mode";
  DROP TYPE "public"."enum__homepage_v_version_status";
  DROP TYPE "public"."enum__homepage_v_published_locale";`)
}
