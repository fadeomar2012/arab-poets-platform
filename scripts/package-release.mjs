#!/usr/bin/env node
/**
 * Clean release packager.
 *
 * Builds a distributable ZIP from an EXPLICIT allowlist of top-level project
 * entries — the repository directory is never zipped blindly. Generated output,
 * secrets, and local editor/CI state are excluded by construction and then the
 * finished archive is inspected: the script FAILS (exit 1) if any forbidden
 * path or extension slipped in.
 *
 * Outputs (under ./release):
 *   arab-poets-platform-v<version>-final.zip
 *   arab-poets-platform-v<version>-final.sha256   (checksum of the ZIP itself)
 *   RELEASE_MANIFEST_v<version>.txt
 *
 * Usage: node scripts/package-release.mjs
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const version = pkg.version;
const stem = `arab-poets-platform-v${version}-final`;

const releaseDir = path.join(root, "release");
const stagingRoot = path.join(releaseDir, ".staging");
const stagingDir = path.join(stagingRoot, stem);
const zipPath = path.join(releaseDir, `${stem}.zip`);
const shaPath = path.join(releaseDir, `${stem}.sha256`);
const manifestPath = path.join(releaseDir, `RELEASE_MANIFEST_v${version}.txt`);

// Explicit allowlist of top-level entries that belong in a release. Anything not
// listed here is never copied. Directories are copied recursively (with the
// per-path excludes below applied).
const ALLOW = [
  "src",
  "public",
  "docs",
  "scripts",
  "e2e",
  "package.json",
  "package-lock.json",
  ".env.example",
  ".gitignore",
  ".nvmrc",
  "eslint.config.mjs",
  "next.config.ts",
  "next-env.d.ts",
  "tsconfig.json",
  "playwright.config.ts",
  "netlify.toml",
  "README.md",
  `CHANGELOG_v${version}.md`,
  `V${version}_FINAL_STATUS.md`,
];

// Paths (relative, posix) or extensions that must NEVER appear in the archive.
const isForbidden = (rel) => {
  const p = rel.split(path.sep).join("/");
  const base = p.split("/").pop();
  const segs = p.split("/");
  if (segs.includes(".git") || segs.includes("node_modules") || segs.includes(".next")) return true;
  if (segs.includes(".claude") || segs.includes(".vscode") || segs.includes(".idea")) return true;
  if (segs.includes("test-results") || segs.includes("playwright-report")) return true;
  if (p.startsWith("e2e/results/") || segs.includes("results") && segs.includes("screens")) return true;
  if (p.startsWith("release/")) return true;
  if (base === ".env" || (base.startsWith(".env") && base !== ".env.example")) return true;
  if (base.endsWith(".tsbuildinfo")) return true;
  if (base.endsWith(".zip") || base.endsWith(".sha256")) return true;
  if (base === ".DS_Store" || base === "Thumbs.db") return true;
  return false;
};

const copyRecursive = (absSrc, relBase) => {
  const stat = fs.statSync(absSrc);
  if (isForbidden(relBase)) return 0;
  if (stat.isDirectory()) {
    let count = 0;
    for (const entry of fs.readdirSync(absSrc)) {
      count += copyRecursive(path.join(absSrc, entry), path.join(relBase, entry));
    }
    return count;
  }
  const dest = path.join(stagingDir, relBase);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(absSrc, dest);
  return 1;
};

// 1. Clean staging + prior outputs.
fs.rmSync(stagingRoot, { recursive: true, force: true });
fs.rmSync(zipPath, { force: true });
fs.mkdirSync(stagingDir, { recursive: true });

// 2. Copy the allowlist into staging.
let fileCount = 0;
const included = [];
for (const entry of ALLOW) {
  const abs = path.join(root, entry);
  if (!fs.existsSync(abs)) {
    console.log(`  · skip (absent): ${entry}`);
    continue;
  }
  const n = copyRecursive(abs, entry);
  fileCount += n;
  included.push(`${entry} (${n} file${n === 1 ? "" : "s"})`);
}
console.log(`Staged ${fileCount} files from ${included.length} top-level entries.`);

// 3. Zip the staging tree (contents live under the versioned folder name).
execFileSync(
  "powershell",
  [
    "-NoProfile",
    "-Command",
    `Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipPath}' -Force`,
  ],
  { stdio: "inherit" },
);

// 4. Inspect the FINISHED archive — fail if any forbidden entry is present.
const listing = execFileSync(
  "powershell",
  [
    "-NoProfile",
    "-Command",
    `Add-Type -AssemblyName System.IO.Compression.FileSystem; ` +
      `$z=[System.IO.Compression.ZipFile]::OpenRead('${zipPath}'); ` +
      `$z.Entries | ForEach-Object { $_.FullName }; $z.Dispose()`,
  ],
  { encoding: "utf8" },
)
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean);

const offenders = listing.filter((rel) => isForbidden(rel));
if (offenders.length) {
  console.error("\n✗ Forbidden entries found in archive:");
  offenders.forEach((o) => console.error(`    ${o}`));
  process.exit(1);
}
console.log(`Archive inspected: ${listing.length} entries, 0 forbidden.`);

// 5. SHA-256 of the ZIP itself.
const zipBuffer = fs.readFileSync(zipPath);
const sha = createHash("sha256").update(zipBuffer).digest("hex");
fs.writeFileSync(shaPath, `${sha}  ${stem}.zip\n`);

// 6. Manifest.
const migrations = fs
  .readdirSync(path.join(root, "src", "migrations"))
  .filter((f) => f.endsWith(".ts") && !f.startsWith("index"))
  .sort();
const nodeVersion = process.version;
let npmVersion = "unknown";
try {
  npmVersion = execFileSync("npm", ["-v"], { encoding: "utf8", shell: true }).trim();
} catch {}

const topLevel = [...new Set(listing.map((e) => e.split("/").slice(0, 2).join("/")))].sort();

const manifest = `Arab Poets Platform — Release Manifest
=======================================

Archive:        ${stem}.zip
SHA-256:        ${sha}
Version:        ${version}
Build date:     ${new Date().toISOString()}
Node version:   ${nodeVersion}
npm version:    ${npmVersion}

Migrations (applied; see \`npm run migrate:status\`):
${migrations.map((m) => `  - ${m.replace(/\.ts$/, "")}`).join("\n")}

Included top-level paths:
${topLevel.map((p) => `  + ${p}`).join("\n")}

Excluded by construction (never packaged):
  - .git/            (VCS history)
  - .next/           (build output)
  - node_modules/    (dependencies — reinstall via npm ci)
  - .claude/ .vscode/ .idea/   (local editor state)
  - test-results/ playwright-report/ e2e/results/  (test artifacts)
  - .env, .env.local, .env.*   (secrets; only .env.example ships)
  - *.tsbuildinfo, *.zip, *.sha256, OS metadata

Archive entry count: ${listing.length}
`;
fs.writeFileSync(manifestPath, manifest);

// 7. Clean staging (leave only distributable outputs).
fs.rmSync(stagingRoot, { recursive: true, force: true });

console.log(`\n✓ Release ready:`);
console.log(`    ${path.relative(root, zipPath)}`);
console.log(`    ${path.relative(root, shaPath)}`);
console.log(`    ${path.relative(root, manifestPath)}`);
console.log(`  SHA-256: ${sha}`);
