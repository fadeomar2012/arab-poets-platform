#!/usr/bin/env node
/**
 * Repeatable stress/smoke check for public routes and RSC stability.
 *
 * Usage: BASE_URL=http://localhost:3000 node scripts/smoke.mjs
 *
 * Fails (exit 1) if any route returns non-200, so an intermittent CMS query
 * failure that surfaces as a 500 (production) is caught deterministically.
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";
const ROUTES = ["/ar", "/en", "/ar/events", "/en/events", "/ar/gallery", "/ar/people", "/ar/about"];
const ROUNDS = Number(process.env.SMOKE_ROUNDS || 6);
const CONCURRENCY = Number(process.env.SMOKE_CONCURRENCY || 8);

const results = [];
let failures = 0;

async function hit(route) {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE}${route}`, { headers: { "cache-control": "no-cache" } });
    const ms = Math.round(performance.now() - start);
    const ok = res.status === 200;
    if (!ok) failures++;
    results.push({ route, status: res.status, ms, ok });
    return ok;
  } catch (err) {
    failures++;
    results.push({ route, status: "ERR", ms: -1, ok: false, err: String(err) });
    return false;
  }
}

console.log(`\nSmoke test → ${BASE}`);
console.log(`Rounds: ${ROUNDS}, concurrency: ${CONCURRENCY}\n`);

// Phase 1: sequential warm-up (one pass).
for (const route of ROUTES) await hit(route);

// Phase 2: concurrent bursts to stress the connection pool.
for (let round = 0; round < ROUNDS; round++) {
  const batch = [];
  for (let c = 0; c < CONCURRENCY; c++) {
    batch.push(hit(ROUTES[(round + c) % ROUTES.length]));
  }
  await Promise.all(batch);
}

// Report per-route stats.
const byRoute = new Map();
for (const r of results) {
  const arr = byRoute.get(r.route) || [];
  arr.push(r);
  byRoute.set(r.route, arr);
}
console.log("Route                 n   ok   fail   p50ms   maxms");
for (const [route, arr] of byRoute) {
  const oks = arr.filter((r) => r.ok).length;
  const fails = arr.length - oks;
  const times = arr.filter((r) => r.ms >= 0).map((r) => r.ms).sort((a, b) => a - b);
  const p50 = times.length ? times[Math.floor(times.length / 2)] : -1;
  const max = times.length ? times[times.length - 1] : -1;
  console.log(
    `${route.padEnd(20)} ${String(arr.length).padStart(3)} ${String(oks).padStart(4)} ${String(fails).padStart(6)} ${String(p50).padStart(7)} ${String(max).padStart(7)}`,
  );
}

const nonOk = results.filter((r) => !r.ok);
if (nonOk.length) {
  console.log("\nNon-200 responses:");
  for (const r of nonOk.slice(0, 20)) console.log(`  ${r.route} → ${r.status}${r.err ? ` (${r.err})` : ""}`);
}

console.log(`\nTotal requests: ${results.length}, failures: ${failures}`);
if (failures > 0) {
  console.log("Result: FAILED\n");
  process.exit(1);
}
console.log("Result: OK\n");
