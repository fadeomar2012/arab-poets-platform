import { z } from "zod";

const emptyToUndefined = (value: unknown) => typeof value === "string" && value.trim() === "" ? undefined : value;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "name_min").max(120, "name_max"),
  email: z.string().trim().email("email_invalid").max(254, "email_max"),
  phoneOrWhatsapp: z.preprocess(emptyToUndefined, z.string().trim().max(40, "phone_max").optional()),
  subject: z.preprocess(emptyToUndefined, z.string().trim().max(180, "subject_max").optional()),
  message: z.string().trim().min(10, "message_min").max(5000, "message_max"),
  consent: z.literal(true, { error: "consent_required" }),
  website: z.string().max(200).optional(),
});

export const participationSchema = z.object({
  fullName: z.string().trim().min(2, "name_min").max(120, "name_max"),
  email: z.string().trim().email("email_invalid").max(254, "email_max"),
  country: z.string().trim().min(2, "country_min").max(120, "country_max"),
  city: z.preprocess(emptyToUndefined, z.string().trim().max(120, "city_max").optional()),
  whatsapp: z.string().trim().min(6, "whatsapp_min").max(25, "whatsapp_max"),
  participationType: z.enum(["poet", "writer", "artist", "media", "other"]),
  shortBio: z.preprocess(emptyToUndefined, z.string().trim().max(1200, "bio_max").optional()),
  externalUrl: z.preprocess(emptyToUndefined, z.string().trim().url("url_invalid").max(500, "url_max").optional()),
  requestedEventSlug: z.preprocess(emptyToUndefined, z.string().trim().max(160).optional()),
  message: z.preprocess(emptyToUndefined, z.string().trim().max(3000, "message_max").optional()),
  consent: z.literal(true, { error: "consent_required" }),
  website: z.string().max(200).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ParticipationInput = z.infer<typeof participationSchema>;
