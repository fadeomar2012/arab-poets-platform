#!/usr/bin/env node
/**
 * Non-destructive environment / database health check.
 *
 * Usage: npm run doctor
 *
 * Verifies required configuration and schema WITHOUT printing any secret
 * values and WITHOUT mutating the database. Exits with code 1 if any critical
 * check fails so it can be used in CI or a pre-deploy gate.
 */
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(projectRoot, ".env.local") });
dotenv.config({ path: path.join(projectRoot, ".env") });

const ok = (label, extra = "") => console.log(`  ✓ ${label}${extra ? ` — ${extra}` : ""}`);
const warn = (label, extra = "") => console.log(`  ⚠ ${label}${extra ? ` — ${extra}` : ""}`);
const fail = (label, extra = "") => console.log(`  ✗ ${label}${extra ? ` — ${extra}` : ""}`);

let hasCritical = false;

console.log("\nArab Poets Platform — doctor\n");

// 1. Required environment variables (presence only, never values).
console.log("Environment variables:");
const required = ["DATABASE_URL", "PAYLOAD_SECRET"];
for (const name of required) {
  if (process.env[name]) ok(`${name} is set`);
  else {
    fail(`${name} is missing`);
    hasCritical = true;
  }
}
const optional = {
  DATABASE_MIGRATION_URL: "direct connection used for migrations",
  NEXT_PUBLIC_SERVER_URL: "public site URL",
  NEXT_PUBLIC_SITE_URL: "public site URL (alt)",
};
for (const [name, note] of Object.entries(optional)) {
  if (process.env[name]) ok(`${name} is set`, note);
  else warn(`${name} not set`, note);
}

// Cloudinary
const cloudinary = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
const cloudinaryReady = cloudinary.every((n) => process.env[n]);
if (cloudinaryReady) ok("Cloudinary configured (media uploads active)");
else warn("Cloudinary not fully configured", "media stored locally / uploads disabled");

// SMTP
const smtpReady = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
if (smtpReady) ok("SMTP configured (real mail transport)");
else warn("SMTP not configured", "console/stream transport used (no real mail)");

// Site URL
if (process.env.NEXT_PUBLIC_SERVER_URL || process.env.NEXT_PUBLIC_SITE_URL) {
  ok("Site URL configured");
} else {
  warn("Site URL falls back to http://localhost:3000");
}

// 2. Database connectivity + schema.
console.log("\nDatabase:");
if (!process.env.DATABASE_URL) {
  fail("Cannot check database — DATABASE_URL missing");
  process.exit(1);
}

const connectionString =
  process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL;
const ssl = connectionString.includes("localhost")
  ? undefined
  : { rejectUnauthorized: false };
const client = new pg.Client({ connectionString, ssl });

try {
  await client.connect();
  ok("Database connection succeeded");

  // Required schema objects introduced by the UI/UX refactor migration.
  const requiredTables = [
    "homepage_statistics",
    "homepage_statistics_locales",
    "_homepage_v_version_statistics",
  ];
  for (const table of requiredTables) {
    const { rows } = await client.query("SELECT to_regclass($1) AS reg", [
      `public.${table}`,
    ]);
    if (rows[0].reg) ok(`table ${table} exists`);
    else {
      fail(`table ${table} MISSING`, "run: npm run migrate");
      hasCritical = true;
    }
  }

  const requiredColumns = [
    ["event_types", "calendar_color"],
    ["event_types", "show_in_calendar_legend"],
  ];
  for (const [table, column] of requiredColumns) {
    const { rows } = await client.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
      [table, column],
    );
    if (rows.length) ok(`column ${table}.${column} exists`);
    else {
      fail(`column ${table}.${column} MISSING`, "run: npm run migrate");
      hasCritical = true;
    }
  }

  // Migration status.
  const { rows: migrationRows } = await client.query(
    `SELECT name, batch FROM payload_migrations ORDER BY batch NULLS FIRST, name`,
  );
  const applied = migrationRows.filter((r) => r.batch != null);
  ok(`migrations applied`, `${applied.length} recorded`);
} catch (error) {
  fail("Database check failed", error.code ? `code ${error.code}` : error.message);
  hasCritical = true;
} finally {
  await client.end().catch(() => {});
}

console.log("");
if (hasCritical) {
  console.log("Result: FAILED — resolve the ✗ items above.\n");
  process.exit(1);
}
console.log("Result: OK — environment and schema look healthy.\n");
