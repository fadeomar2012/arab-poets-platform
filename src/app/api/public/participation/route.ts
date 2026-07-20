import config from "@payload-config";
import { getPayload } from "payload";
import { z } from "zod";
import { participationSchema } from "@/lib/forms/schemas";
import { consumeRateLimit, getClientIP } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const rateLimit = consumeRateLimit({ key: `participation:${ip}`, limit: 3, windowMs: 15 * 60 * 1000 });
  if (!rateLimit.allowed) return Response.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } });

  try {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }
    const { website, externalUrl, requestedEventSlug, ...data } = participationSchema.parse(raw);
    if (website) return Response.json({ ok: true }, { status: 201 });
    const payload = await getPayload({ config });
    let requestedEvent: number | undefined;
    if (requestedEventSlug) {
      const found = await payload.find({ collection: "events", where: { slug: { equals: requestedEventSlug } }, limit: 1, depth: 0, overrideAccess: true });
      requestedEvent = found.docs[0] ? Number(found.docs[0].id) : undefined;
    }
    const created = await payload.create({ collection: "participation-requests", overrideAccess: true, data: { ...data, externalUrl: externalUrl || undefined, requestedEvent, consent: true, status: "new" } });
    return Response.json({ ok: true, reference: `PR-${String(created.id).slice(-8)}` }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ ok: false, error: "invalid", fieldErrors: error.flatten().fieldErrors }, { status: 400 });
    console.error("Failed to save participation request", error);
    return Response.json({ ok: false, error: "failed" }, { status: 500 });
  }
}
