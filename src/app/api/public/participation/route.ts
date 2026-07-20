import config from "@payload-config";
import { getPayload } from "payload";
import { z } from "zod";
import { consumeRateLimit, getClientIP } from "@/lib/server/rate-limit";

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  country: z.string().trim().min(2).max(120),
  city: z.string().trim().max(120).optional(),
  whatsapp: z.string().trim().min(6).max(25),
  participationType: z.enum(["poet", "writer", "artist", "media", "other"]),
  shortBio: z.string().trim().max(1200).optional(),
  externalUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  message: z.string().trim().max(3000).optional(),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const rateLimit = consumeRateLimit({
    key: `participation:${ip}`,
    limit: 3,
    windowMs: 15 * 60 * 1000,
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
    const { website, externalUrl, ...data } = schema.parse(await request.json());
    if (website) return Response.json({ ok: true }, { status: 201 });

    const payload = await getPayload({ config });
    await payload.create({
      collection: "participation-requests",
      overrideAccess: true,
      data: {
        ...data,
        externalUrl: externalUrl || undefined,
        consent: true,
        status: "new",
      },
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (!(error instanceof z.ZodError)) {
      console.error("Failed to save participation request", error);
    }
    return Response.json(
      { ok: false, error: error instanceof z.ZodError ? "invalid" : "failed" },
      { status: error instanceof z.ZodError ? 400 : 500 },
    );
  }
}
