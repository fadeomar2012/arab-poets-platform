import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Disables Draft Mode and returns to a safe, server-controlled destination.
 * Only relative same-origin locale paths are honoured to avoid open redirects.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const draft = await draftMode();
  draft.disable();

  const to = searchParams.get("to") ?? "";
  const safe = /^\/(ar|en)(\/[a-z0-9/-]*)?$/.test(to) ? to : "/ar";
  redirect(safe);
}
