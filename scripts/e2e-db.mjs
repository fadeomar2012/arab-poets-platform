#!/usr/bin/env node
/**
 * E2E database helper — count or delete inbox records created by automated
 * tests, identified by a unique token. NEVER deletes records that do not
 * contain the token, so real submissions are always preserved.
 *
 * Usage:
 *   node scripts/e2e-db.mjs count <token>
 *   node scripts/e2e-db.mjs cleanup <token>
 */
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(projectRoot, ".env.local") });
dotenv.config({ path: path.join(projectRoot, ".env") });
process.env.PAYLOAD_CONFIG_PATH = path.join(projectRoot, "src/payload.config.ts");

const [command, token] = process.argv.slice(2);
if (!command || !token) {
  console.error("Usage: node scripts/e2e-db.mjs <count|cleanup> <token>");
  process.exit(2);
}
if (!token.startsWith("E2E-")) {
  console.error("Refusing to operate on a token that does not start with 'E2E-'.");
  process.exit(2);
}

const { getPayload } = await import("payload");
const { default: config } = await import("../src/payload.config.ts");
const payload = await getPayload({ config });

const collections = ["contact-messages", "participation-requests"];
let total = 0;
const matches = [];

for (const collection of collections) {
  const found = await payload.find({
    collection,
    limit: 200,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    sort: "-createdAt",
  });
  for (const doc of found.docs) {
    // Match the token anywhere in the record's own string fields.
    if (JSON.stringify(doc).includes(token)) matches.push({ collection, id: doc.id });
  }
}

total = matches.length;

if (command === "count") {
  console.log(JSON.stringify({ token, total, matches }));
  process.exit(0);
}

if (command === "cleanup") {
  let deleted = 0;
  for (const { collection, id } of matches) {
    await payload.delete({ collection, id, overrideAccess: true });
    deleted++;
  }
  console.log(JSON.stringify({ token, deleted }));
  process.exit(0);
}

console.error(`Unknown command: ${command}`);
process.exit(2);
