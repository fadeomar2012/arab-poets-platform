// Next.js cache tags shared between the content loaders and the Payload
// revalidation hooks. Kept dependency-free so a CMS hook can import it without
// pulling in the Payload runtime.

// Invalidated whenever any event is created/updated/deleted/published so that
// month-scoped calendar responses never serve stale or draft data.
export const EVENTS_CALENDAR_TAG = "events-calendar";
