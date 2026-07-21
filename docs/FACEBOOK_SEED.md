# Facebook content seed (v2)

The default seed (`npm run seed`) is **data-driven**. All content lives as JSON and
locally-downloaded images under a single canonical dataset; the TypeScript in
`scripts/seed.ts` and `scripts/seed/` only parses, validates, resolves
relationships, applies publication rules, and upserts idempotently.

## Canonical dataset location

```
seed-data/facebook-v2/
  data/            # JSON source of truth (events, people, media-manifest, …)
  images/          # the actual binaries uploaded to Payload Media
    branding/  events/  people/  review/
  catalog/         # contact sheets for human review only (NOT imported)
  README_AR.md     # Arabic package notes from the content team
  MANIFEST.sha256  # checksums for the packaged files
```

The images under `seed-data/facebook-v2/images/` (and the `catalog/` contact
sheets) are the seed's source of truth on disk, but they are **not tracked in
git** — binary assets would bloat the repository. Only the JSON dataset,
`README_AR.md`, and `MANIFEST.sha256` are versioned. To run the seed, restore the
`images/` (and `catalog/`) folders from the client-provided
`facebook_data_seed_v2` package into `seed-data/facebook-v2/`. The seed reads and
uploads them directly from there — they are not copied into `public/images/`, and
the original ZIP is not a runtime input.

All imagery in this dataset is **client-owned and approved for project use**:
the organization that owns the website also owns the Facebook page and
authorized the development team to use these public images and data.

## Validating the dataset

```bash
node seed-data/facebook-v2/scripts/validate.mjs   # if the package validator is present
npm run seed -- --dry-run                          # full preflight against the DB
```

The seed's own dry-run performs every read, mapping, and conflict check without
writing. It refuses to continue (exit 1) on any fatal problem: missing image
files, duplicate media keys or slugs, invalid roles, a broken required taxonomy
relationship, a city attached to the wrong country, invalid dates, or a missing
event type. Non-fatal issues (such as an unresolved official email) are reported
as warnings.

## Running the seed safely

```bash
npm run seed -- --dry-run --update-existing --prune-legacy-placeholders   # preview
npm run seed -- --update-existing --prune-legacy-placeholders             # write
npm run seed -- --update-existing --prune-legacy-placeholders             # idempotency
npm run seed:verify                                                       # verify
```

Flags (equivalent environment variables in parentheses):

| Flag | Meaning |
| --- | --- |
| `--dry-run` | Read/validate/report only. No writes. |
| `--update-existing` (`SEED_UPDATE_EXISTING=true`) | Refresh managed content on records that already exist. Without it, existing records are left untouched (status is still reconciled). |
| `--prune-legacy-placeholders` | Softly retire old hardcoded fixtures positively identified as placeholders (unpublish / hide / deactivate — never hard-delete). |

The seed is **idempotent**: media are keyed by `internalSeedKey`
(`facebook-seed-v2:<media-key>`) so binaries are never re-uploaded; taxonomies,
people, events, and works are keyed by slug. With `--update-existing`, each
record is compared field-by-field and only written when something actually
changed, so a second run does not grow version history.

The seed never resets, truncates, or blanket-deletes anything, and never
touches users, inbox submissions, or unrelated editor-created content.

## `country-unconfirmed`

The `People.country` field is required, but some reviewed people cards do not
state a country. Rather than guessing, the seed creates one internal, **inactive**
country taxonomy record:

- slug `country-unconfirmed`
- Arabic: `دولة غير مؤكدة — للمراجعة`
- English: `Country unconfirmed — review only`
- `isActive: false`, `order: 9999`

People with a missing country are attached to this record and created as
**drafts** with `showInPublicDirectory: false` and `showContactPublicly: false`,
so they never appear publicly. Authenticated editors can still find the inactive
record in the CMS.

### Reviewing missing-country profiles

An editor should open each draft person that uses `country-unconfirmed`, replace
it with the real country (and city if known), then publish the profile and set
`showInPublicDirectory` as appropriate. See `data/review-queue.json` for the list.

## Which records remain drafts, and why

- **People** with `verificationStatus: needsReview`, or with a missing country,
  are drafts. Only `verified` people that have a real country are published
  (respecting each record's `showInPublicDirectory`).
- **Events** without a confirmed start time, or with `verificationStatus:
  needsReview`, are drafts. `verified` and `approvedWithGaps` events with a
  start time are published, with any gaps documented in the archive notes.
- **Literary works** are all drafts — the prepared titles still require
  editorial confirmation, and their related people are drafts too.

## Official email

The package contains **no** verified official email. Resolution order:

1. If the stored `site-settings.officialEmail` is already a valid, non-placeholder
   address, it is preserved.
2. Otherwise, if `SEED_OFFICIAL_EMAIL` holds a valid email, it is used:
   ```bash
   SEED_OFFICIAL_EMAIL="contact@theirdomain.org" npm run seed -- --update-existing
   ```
3. If neither is available, the seed does **not** invent one. Because the field
   is required, any existing value is preserved and the report prints a prominent
   warning: *"Official email remains unresolved and requires client confirmation."*
   (The public site already hides placeholder `example.org` emails, so nothing
   false is shown publicly.)

## Media & Facebook URLs

Images are uploaded through the configured Payload media adapter (Cloudinary when
credentials are present, local storage otherwise). The seed **never** downloads
from Facebook and **never** stores Facebook CDN URLs as permanent website image
URLs — the permanent URL is whatever the media adapter returns for the uploaded
binary. Contact sheets under `catalog/` are for human review and are not imported.
