# Payload Integration Plan

The frontend is intentionally built first with a typed content adapter.

## Current data flow

```text
Page / Component
  → src/lib/content/index.ts
  → mock adapter
  → typed mock records
```

## Future data flow

```text
Page / Component
  → src/lib/content/index.ts
  → Payload Local API adapter
  → PostgreSQL
```

## Integration steps

1. Install Payload into this existing supported Next.js application.
2. Add the `(payload)` route group and `payload.config.ts`.
3. Add PostgreSQL and environment variables.
4. Apply Events, People, Media, Partners, Requests, Messages, and Globals collections.
5. Create `src/lib/content/payload-adapter.ts`.
6. Replace exports in `src/lib/content/index.ts`.
7. Add draft preview and publish revalidation.
8. Replace demo forms with server actions or route handlers.
9. Add external media storage and transactional email.

## Compatibility

This project pins Next.js `16.2.10`, which is within Payload's currently documented `16.2.6+` compatible range. Recheck the official Payload compatibility requirements before installation.
