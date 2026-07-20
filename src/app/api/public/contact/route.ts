import config from "@payload-config";
import { getPayload } from "payload";
import { z } from "zod";
import { consumeRateLimit, getClientIP } from "@/lib/server/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phoneOrWhatsapp: z.string().trim().max(40).optional(),
  subject: z.string().trim().max(180).optional(),
  message: z.string().trim().min(10).max(5000),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const rateLimit = consumeRateLimit({
    key: `contact:${ip}`,
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return Response.json(
      { ok: false, error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  try {
    const { website, ...data } = schema.parse(await request.json());
    if (website) return Response.json({ ok: true }, { status: 201 });

    const payload = await getPayload({ config });
    await payload.create({
      collection: "contact-messages",
      overrideAccess: true,
      data: { ...data, consent: true, status: "new" },
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (!(error instanceof z.ZodError)) {
      console.error("Failed to save contact message", error);
    }
    return Response.json(
      { ok: false, error: error instanceof z.ZodError ? "invalid" : "failed" },
      { status: error instanceof z.ZodError ? 400 : 500 },
    );
  }
}
