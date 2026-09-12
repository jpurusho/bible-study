# Prod write incident — 2026-08-21 (project avctqylfozfsoavkmxgt)

While publishing the Acts 21–23 sessions, `supabase/prod_acts_21_23.sql` assumed
chapter id `20000000-0000-0000-0000-000000000024`'s predecessor
`...-000000000022` was unused because no chapter numbered 22 existed. That was
wrong: **chapter id suffixes track creation order, not chapter number.** Acts 2
was added to prod after chapters 0–17/20/21, so it holds id `...022` with
`chapter_number = 2`.

The `ON CONFLICT (id) DO UPDATE` therefore overwrote the Acts 2 chapter row,
renaming it to "Paul's Defense before the Crowd" and renumbering it to 22. Its
two sessions ("The Promised Holy Spirit", "The Explanation of Pentecost") were
untouched but appeared under the wrong chapter for a few minutes.

## Restored

Acts 22 was moved to a verified-unused id (`...024`) and the Acts 2 row was put
back to `title = 'The Day of Pentecost'`, `chapter_number = 2`,
`display_order = 2`, `is_published = true`. Both Acts 2 sessions are published
under it again.

## One field could not be recovered

`chapters.description` for **The Day of Pentecost** (`...022`). It was never
captured in a dump before the overwrite, the project has no physical backups and
PITR is disabled (`supabase backups list` → `"backups": [], "pitr_enabled": false`),
so the original text is unrecoverable. It is now `NULL` rather than a guess.

**Action needed:** re-enter that one-line description in the admin UI. Sibling
chapters follow the pattern `Acts N — <short summary>` (e.g. `Acts 1 — The
Ascension and choosing of Matthias`, `Acts 3 — Healing and preaching`), but the
exact original wording is not known and was deliberately not invented.

## Other rows changed in the same publish

- `chapters` `...021` (Acts 21) — `description` changed from
  `Acts 21:17-22:21 — Humility, hostility, and Paul's defense before the crowd`
  to `Acts 21 — Humility, love, hostility, and the first defense speech`.
  Original in `prod-chapter-21-before-2026-08-21.json`. Intentional.
- `sessions` `...033` ("Paul in Jerusalem: Humility, Hostility, and Defense",
  Acts 21:17–22:21) — unpublished and renumbered to 90 because the new
  chapter-by-chapter sessions supersede it. Content untouched; full row in
  `prod-sessions-ch21-23-before-2026-08-21.json`. Undo with:

  ```sql
  UPDATE public.sessions SET is_published = true, session_number = 2, display_order = 2
  WHERE id = '30000000-0000-0000-0000-000000000033';
  ```
