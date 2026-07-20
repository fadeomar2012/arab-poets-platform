import { postgresAdapter } from "@payloadcms/db-postgres";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
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

const smtpConfigured = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
);

const fromAddress = process.env.SMTP_FROM_ADDRESS || "no-reply@arabpoets.org";
const fromName = process.env.SMTP_FROM_NAME || "Arab Poets Association";

/**
 * Production/staging: real SMTP transport only when all credentials exist.
 * Development / missing credentials: a console (streamTransport) transport that
 * never sends real mail and needs no credentials, so password-reset flows keep
 * working locally without a warning about a missing adapter.
 */
const emailAdapter = nodemailerAdapter(
  smtpConfigured
    ? {
        defaultFromAddress: fromAddress,
        defaultFromName: fromName,
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
      }
    : {
        defaultFromAddress: fromAddress,
        defaultFromName: fromName,
        transportOptions: {
          streamTransport: true,
          newline: "unix",
          buffer: true,
        },
      },
);

const allowedOrigins = new Set([
  serverURL,
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.URL,
  process.env.DEPLOY_PRIME_URL,
]);

export default buildConfig({
  serverURL,
  email: emailAdapter,
  cors: [...allowedOrigins].filter((origin): origin is string => Boolean(origin)),
  csrf: [...allowedOrigins].filter((origin): origin is string => Boolean(origin)),
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: "— Arab Poets CMS" },
    components: {
      graphics: {
        Logo: "./components/admin/AdminLogo#default",
        Icon: "./components/admin/AdminIcon#default",
      },
    },
    dashboard: {
      widgets: [
        {
          slug: "editorial-overview",
          Component: "./components/admin/EditorialDashboard#default",
          minWidth: "full",
          maxWidth: "full",
        },
      ],
      defaultLayout: [{ widgetSlug: "editorial-overview", width: "full" }] as never,
    },
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
