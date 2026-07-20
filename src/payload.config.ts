import { postgresAdapter } from "@payloadcms/db-postgres";
import { cloudStoragePlugin } from "@payloadcms/plugin-cloud-storage";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { ar } from "@payloadcms/translations/languages/ar";
import { en } from "@payloadcms/translations/languages/en";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig } from "payload";
import sharp from "sharp";
import { cloudinaryAdapter } from "./cms/cloudinary/adapter";
import { EventSeries } from "./cms/collections/EventSeries";
import { Events } from "./cms/collections/Events";
import { ContactMessages, ParticipationRequests } from "./cms/collections/Inboxes";
import { LiteraryWorks } from "./cms/collections/LiteraryWorks";
import { Media } from "./cms/collections/Media";
import { Partners } from "./cms/collections/Partners";
import { People } from "./cms/collections/People";
import { Cities, Countries, EventTypes } from "./cms/collections/Taxonomies";
import { Users } from "./cms/collections/Users";
import { Homepage, SiteSettings } from "./cms/globals";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const requireEnvironmentVariable = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const databaseURL = requireEnvironmentVariable("DATABASE_URL");
const payloadSecret = requireEnvironmentVariable("PAYLOAD_SECRET");
const serverURL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";
const cloudinaryEnabled = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);

const allowedOrigins = new Set([
  serverURL,
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.URL,
  process.env.DEPLOY_PRIME_URL,
]);

export default buildConfig({
  serverURL,
  cors: [...allowedOrigins].filter((origin): origin is string => Boolean(origin)),
  csrf: [...allowedOrigins].filter((origin): origin is string => Boolean(origin)),
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: "— Arab Poets CMS" },
  },
  i18n: {
    fallbackLanguage: "ar",
    supportedLanguages: { ar, en },
  },
  editor: lexicalEditor(),
  experimental: { localizeStatus: true },
  collections: [
    Users,
    Media,
    EventTypes,
    EventSeries,
    Countries,
    Cities,
    Events,
    People,
    LiteraryWorks,
    Partners,
    ParticipationRequests,
    ContactMessages,
  ],
  globals: [SiteSettings, Homepage],
  localization: {
    locales: [
      { code: "ar", label: "العربية", rtl: true },
      { code: "en", label: "English" },
    ],
    defaultLocale: "ar",
    fallback: true,
  },
  secret: payloadSecret,
  db: postgresAdapter({
    pool: {
      connectionString: databaseURL,
      ssl: databaseURL.includes("localhost")
        ? undefined
        : { rejectUnauthorized: false },
      max: 3,
    },
    push: process.env.PAYLOAD_DB_PUSH === "true",
    migrationDir: path.resolve(dirname, "migrations"),
  }),
  plugins: [
    cloudStoragePlugin({
      alwaysInsertFields: true,
      collections: {
        media: {
          adapter: cloudinaryAdapter,
          prefix: "media",
          disablePayloadAccessControl: true,
          disableLocalStorage: cloudinaryEnabled,
        },
      },
      enabled: cloudinaryEnabled,
    }),
  ],
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
    strictDraftTypes: true,
  },
});
