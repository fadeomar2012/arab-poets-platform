import config from "@payload-config";
import { getPayload } from "payload";
import { z } from "zod";
import { contactSchema } from "@/lib/forms/schemas";
import { consumeRateLimit, getClientIP } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const rateLimit = consumeRateLimit({ key: `contact:${ip}`, limit: 5, windowMs: 10 * 60 * 1000 });
  if (!rateLimit.allowed) return Response.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } });

  try {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }
    const { website, ...data } = contactSchema.parse(raw);
    if (website) return Response.json({ ok: true }, { status: 201 });
    const payload = await getPayload({ config });
    const created = await payload.create({ collection: "contact-messages", overrideAccess: true, data: { ...data, consent: true, status: "new" } });
    return Response.json({ ok: true, reference: `CM-${String(created.id).slice(-8)}` }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ ok: false, error: "invalid", fieldErrors: error.flatten().fieldErrors }, { status: 400 });
    console.error("Failed to save contact message", error);
    return Response.json({ ok: false, error: "failed" }, { status: 500 });
  }
}
