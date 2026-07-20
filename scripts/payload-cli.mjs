import dotenv from "dotenv";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(projectRoot, ".env.local") });
dotenv.config({ path: path.join(projectRoot, ".env") });

const args = process.argv.slice(2);
const isMigrationCommand = args[0]?.startsWith("migrate");

if (isMigrationCommand && process.env.DATABASE_MIGRATION_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_MIGRATION_URL;
}

process.env.PAYLOAD_CONFIG_PATH = path.join(projectRoot, "src/payload.config.ts");

const bin = path.join(projectRoot, "node_modules/payload/bin.js");
const child = spawn(process.execPath, [bin, ...args], {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 1));
