#!/usr/bin/env python3
"""Generate SQL for the Reflections book and its content.

The Reflections book holds poems, prose reflections, and curated quotes
organized by spiritual theme. Unlike the Acts Bible study notes, these are
not tied to a specific scripture series.

Usage:
    python3 scripts/publish-reflections.py             # preview SQL
    python3 scripts/publish-reflections.py --apply     # write SQL to supabase/prod_reflections.sql
"""

from __future__ import annotations

import argparse
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

# Re-use the convert() and sql_str() helpers from publish-content.py
import importlib.util
spec = importlib.util.spec_from_file_location(
    "publish_content", ROOT / "scripts" / "publish-content.py"
)
mod = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
spec.loader.exec_module(mod)  # type: ignore[union-attr]
convert = mod.convert
sql_str = mod.sql_str

# ── IDs (hand-assigned sequential, matching prod convention) ──────────────────
BOOK_ID      = "10000000-0000-0000-0000-000000000002"
CHAPTER_ID   = "20000000-0000-0000-0000-000000000025"
SESSION_ID   = "30000000-0000-0000-0000-000000000038"

# ── Content plan ─────────────────────────────────────────────────────────────
CHAPTERS = [
    {
        "id":           CHAPTER_ID,
        "number":       1,
        "title":        "God's Shaping Hand",
        "description":  "Reflections — On how God molds us through trials, failure, and frailty",
        "sessions": [
            {
                "id":        SESSION_ID,
                "file":      "content/reflections/gods-shaping-hand.md",
                "title":     "When God Wants to Drill a Man",
                "scripture": "Jeremiah 18:1-6",
                "number":    1,
            }
        ],
    }
]


def build_sql() -> str:
    chapter_rows = []
    session_rows = []

    for ch in CHAPTERS:
        chapter_rows.append(
            "  ({book_id}, {id}, {title}, {num}, {desc}, {num}, true)".format(
                book_id=sql_str(BOOK_ID),
                id=sql_str(ch["id"]),
                title=sql_str(ch["title"]),
                num=ch["number"],
                desc=sql_str(ch["description"]),
            )
        )

        for s in ch["sessions"]:
            path = ROOT / s["file"]
            if not path.exists():
                sys.exit(f"missing: {path}")
            content = convert(path.read_text(encoding="utf-8"))
            session_rows.append(
                "  ({id}, {ch}, {title}, {num}, {ref}, {content}, {num}, true, now())".format(
                    id=sql_str(s["id"]),
                    ch=sql_str(ch["id"]),
                    title=sql_str(s["title"]),
                    num=s["number"],
                    ref=sql_str(s["scripture"]),
                    content=sql_str(content),
                )
            )

    return """BEGIN;

-- ── Reflections book ──────────────────────────────────────────────────────────
-- A space for poems, prose reflections, and curated quotes organized by theme.
-- Separate from the Acts Bible study series so it shows as its own entry on
-- the home page. display_order=2 puts it after Acts.

INSERT INTO public.books (id, title, slug, description, display_order, is_published)
VALUES (
  {book_id},
  'Reflections',
  'reflections',
  'Poems, prose, and curated quotes on faith, frailty, and God''s redeeming work',
  2,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title        = EXCLUDED.title,
  description  = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published;

-- ── Chapters ─────────────────────────────────────────────────────────────────
INSERT INTO public.chapters
  (book_id, id, title, chapter_number, description, display_order, is_published)
VALUES
{chapters}
ON CONFLICT (id) DO UPDATE SET
  title          = EXCLUDED.title,
  description    = EXCLUDED.description,
  chapter_number = EXCLUDED.chapter_number,
  display_order  = EXCLUDED.display_order,
  is_published   = EXCLUDED.is_published;

-- ── Sessions ─────────────────────────────────────────────────────────────────
INSERT INTO public.sessions
  (id, chapter_id, title, session_number, scripture_reference, content,
   display_order, is_published, published_at)
VALUES
{sessions}
ON CONFLICT (id) DO UPDATE SET
  title               = EXCLUDED.title,
  scripture_reference = EXCLUDED.scripture_reference,
  content             = EXCLUDED.content,
  session_number      = EXCLUDED.session_number,
  display_order       = EXCLUDED.display_order,
  is_published        = EXCLUDED.is_published;

COMMIT;
""".format(
        book_id=sql_str(BOOK_ID),
        chapters=",\n".join(chapter_rows),
        sessions=",\n".join(session_rows),
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="write SQL to supabase/prod_reflections.sql")
    args = ap.parse_args()

    sql = build_sql()

    if args.apply:
        out = ROOT / "supabase" / "prod_reflections.sql"
        out.write_text(sql, encoding="utf-8")
        print(f"wrote {out.relative_to(ROOT)}")
    else:
        print(sql)


if __name__ == "__main__":
    main()
