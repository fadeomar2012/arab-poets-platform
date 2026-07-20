/**
 * Idempotent repair for legacy Media records whose stored `url` column still
 * contains Payload's cloud-storage `prefix` query parameter (e.g.
 * `?prefix=media`). That parameter is meaningless to Cloudinary and was the
 * source of malformed image requests in v0.3.
 *
 * Note: Payload's cloud-storage plugin regenerates `url` on read, so this stale
 * value is normally masked by the API and never served to the public site
 * (which also prefers `cloudinary_secure_url` and strips the prefix in the
 * image loader). This script cleans the raw column directly so the persisted
 * data matches what is served.
 *
 * The script is non-destructive: it never deletes media and never touches any
 * relationship, so every reference from Events, People, Partners, and Globals
 * is preserved. It only rewrites the offending `url` string in place.
 *
 * Usage:
 *   node --import tsx scripts/repair-media-urls.ts          # dry-run (default)
 *   node --import tsx scripts/repair-media-urls.ts --apply  # write changes
 */
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(projectRoot, ".env.local") });
dotenv.config({ path: path.join(projectRoot, ".env") });

const apply = process.argv.includes("--apply");
const databaseURL = process.env.DATABASE_URL;
if (!databaseURL) throw new Error("Missing DATABASE_URL");

const pool = new pg.Pool({
  connectionString: databaseURL,
  ssl: databaseURL.includes("localhost") ? undefined : { rejectUnauthorized: false },
  max: 2,
});

const sanitize = (raw: string): string => {
  try {
    const url = new URL(raw);
    url.searchParams.delete("prefix");
    return url.toString();
  } catch {
    return raw.replace(/([?&])prefix=[^&]*(&?)/g, (_m, sep, trailing) =>
      sep === "?" && trailing ? "?" : "",
    );
  }
};

const { rows } = await pool.query<{ id: number; url: string; filename: string | null }>(
  `SELECT id, url, filename FROM media WHERE url LIKE '%prefix=%' ORDER BY id`,
);

console.log(`Found ${rows.length} media record(s) with a "prefix=" query in url.`);
console.log(apply ? "Mode: APPLY (changes will be written)\n" : "Mode: DRY-RUN (no changes)\n");

let changed = 0;
for (const row of rows) {
  const next = sanitize(row.url);
  if (next === row.url) continue;
  console.log(`#${row.id} ${row.filename ?? ""}`);
  console.log(`  before: ${row.url}`);
  console.log(`  after:  ${next}`);
  if (apply) {
    await pool.query(`UPDATE media SET url = $1 WHERE id = $2`, [next, row.id]);
    changed += 1;
  }
}

if (apply) {
  console.log(`\nApplied ${changed} update(s).`);
} else if (rows.length > 0) {
  console.log("\nRe-run with --apply to write these changes.");
}

await pool.end();
process.exit(0);
