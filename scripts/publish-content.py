#!/usr/bin/env python3
"""Convert content/*.md study notes into sessions.content HTML and emit idempotent SQL.

The app stores session content as HTML (see app/CLAUDE.md). The admin editor's
"Import Markdown" button uses app/src/lib/markdown-to-html.ts, which is a good
enough one-way converter for pasting but emits unwrapped <li> for ordered lists
and splits multi-line blockquotes into one blockquote per line. This script emits
the same element vocabulary as supabase/seed.sql (h1-h3, p, ul/ol/li,
blockquote>p, strong, em, hr) so ContentRenderer's prose styles apply unchanged.

Usage:
    python3 scripts/publish-content.py            # write supabase/seed_acts_21_26.sql
    python3 scripts/publish-content.py --html-only content/acts/acts-21.md
"""

from __future__ import annotations

import argparse
import html
import re
import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BOOK_ID = "10000000-0000-0000-0000-000000000001"  # Acts, from supabase/seed.sql

# Deterministic ids so re-running updates rows instead of duplicating them.
NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")


def det_uuid(kind: str, key: str) -> str:
    return str(uuid.uuid5(NAMESPACE, f"bible-study/{kind}/{key}"))


# --- chapter / session plan -------------------------------------------------
# Mirrors the existing seed pattern: chapter_number is the Bible chapter, the
# title is thematic, and an overview rides as session 1 (as "Introduction to
# Acts" does under chapter 1).
CHAPTERS = [
    {
        "key": "acts-21",
        "number": 21,
        "title": "Paul in Jerusalem",
        "description": "Acts 21 — Humility, love, hostility, and the first defense speech",
        "sessions": [
            {
                "file": "content/acts/acts-21-26-overview.md",
                "title": "Paul's Five Defense Speeches (Acts 21–26)",
                "scripture": "Acts 21-26",
            },
            {
                "file": "content/acts/acts-21.md",
                "title": "Paul in Jerusalem — Humility, Love, and Hostility",
                "scripture": "Acts 21:17-40",
            },
        ],
    },
    {
        "key": "acts-22",
        "number": 22,
        "title": "Paul's Defense before the Crowd",
        "description": "Acts 22 — Honesty, loyalty, and a Roman citizen",
        "sessions": [
            {
                "file": "content/acts/acts-22.md",
                "title": "Paul's Defense — Honesty, Loyalty, and a Roman Citizen",
                "scripture": "Acts 22",
            }
        ],
    },
    {
        "key": "acts-23",
        "number": 23,
        "title": "Jesus Stands with Us",
        "description": "Acts 23 — Before the council and under God's sovereign hand",
        "sessions": [
            {
                "file": "content/acts/acts-23.md",
                "title": "Jesus Stands with Us — Before the Council and Under God's Sovereign Hand",
                "scripture": "Acts 23",
            }
        ],
    },
]

# --- production id map ------------------------------------------------------
# Production (project avctqylfozfsoavkmxgt) predates this script and uses
# hand-assigned sequential ids: chapters 20000000-...-0000000000NN and sessions
# 30000000-...-0000000000NN.
#
# WARNING: the id suffix tracks CREATION ORDER, not the chapter number. Acts 2
# was added to prod after chapters 0-17/20/21, so it holds id ...022 while its
# chapter_number is 2. Never assume ...0NN is free because no chapter numbered NN
# exists — query the ids directly. (An earlier run of this script assumed that and
# overwrote the Acts 2 chapter row; see backups/.)
PROD_CHAPTER_IDS = {
    "acts-21": "20000000-0000-0000-0000-000000000021",  # existing row, reused
    "acts-22": "20000000-0000-0000-0000-000000000024",  # NOT ...022 (= Acts 2)
    "acts-23": "20000000-0000-0000-0000-000000000023",
}
PROD_SESSION_IDS = {
    "acts-21/1": "30000000-0000-0000-0000-000000000034",
    "acts-21/2": "30000000-0000-0000-0000-000000000035",
    "acts-22/1": "30000000-0000-0000-0000-000000000036",
    "acts-23/1": "30000000-0000-0000-0000-000000000037",
}

# The pre-existing prod session under chapter 21 covers Acts 21:17-22:21 as one
# combined study, which is the same ground the new acts-21 + acts-22 sessions
# cover. Publishing alongside it would show readers duplicate coverage, so it is
# unpublished and renumbered out of the way instead of being overwritten. The
# row itself is left intact (and is dumped to backups/) so this is one UPDATE to
# reverse.
PROD_ARCHIVE_SESSION_ID = "30000000-0000-0000-0000-000000000033"
PROD_ARCHIVE_SESSION_NUMBER = 90

OUTLINE_RE = re.compile(r"^(\s+|[IVX]+\.\s|[A-Z]\.\s)")


def inline(text: str) -> str:
    """Escape HTML, then apply bold/italic. Order matters: ** before *."""
    out = html.escape(text, quote=False)
    out = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", out)
    out = re.sub(r"(?<!\*)\*([^*]+?)\*(?!\*)", r"<em>\1</em>", out)
    return out


def convert(md: str, drop_title: bool = True) -> str:
    """Markdown -> HTML using only elements ContentRenderer styles."""
    lines = md.replace("\r\n", "\n").split("\n")
    out: list[str] = []
    i = 0
    dropped_title = False

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            i += 1
            continue

        if stripped == "---":
            out.append("<hr>")
            i += 1
            continue

        m = re.match(r"^(#{1,3})\s+(.*)$", stripped)
        if m:
            level = len(m.group(1))
            # The session page already renders session.title as an <h1>, so the
            # leading document title would be a visible duplicate.
            if level == 1 and drop_title and not dropped_title:
                dropped_title = True
                i += 1
                continue
            out.append(f"<h{level}>{inline(m.group(2))}</h{level}>")
            i += 1
            continue

        # Blockquote: consecutive "> " lines become ONE blockquote. A trailing
        # em-dash attribution line becomes its own <p> inside it.
        if stripped.startswith(">"):
            body: list[str] = []
            attrib: str | None = None
            while i < len(lines) and lines[i].strip().startswith(">"):
                q = re.sub(r"^>\s?", "", lines[i].strip())
                if q.startswith("—"):
                    attrib = q
                else:
                    body.append(q)
                i += 1
            parts = []
            if body:
                parts.append(f"<p>{inline(' '.join(body))}</p>")
            if attrib:
                parts.append(f"<p>{inline(attrib)}</p>")
            out.append(f"<blockquote>{''.join(parts)}</blockquote>")
            continue

        # Unordered list
        if re.match(r"^-\s+", stripped):
            items = []
            while i < len(lines) and re.match(r"^-\s+", lines[i].strip()):
                items.append(f"<li>{inline(re.sub(r'^-\s+', '', lines[i].strip()))}</li>")
                i += 1
            out.append(f"<ul>{''.join(items)}</ul>")
            continue

        # Ordered list
        if re.match(r"^\d+\.\s+", stripped):
            items = []
            while i < len(lines) and re.match(r"^\d+\.\s+", lines[i].strip()):
                items.append(f"<li>{inline(re.sub(r'^\d+\.\s+', '', lines[i].strip()))}</li>")
                i += 1
            out.append(f"<ol>{''.join(items)}</ol>")
            continue

        # Paragraph: gather until blank line or a block-level marker.
        block: list[str] = []
        while i < len(lines):
            cur = lines[i]
            s = cur.strip()
            if not s or s == "---" or s.startswith(">") or s.startswith("#"):
                break
            if re.match(r"^(-|\d+\.)\s+", s):
                break
            block.append(cur)
            i += 1

        # Outline blocks (indented / "I." / "A.") keep their line breaks.
        if any(OUTLINE_RE.match(b) for b in block[1:]):
            out.append("<p>" + "<br>".join(inline(b.strip()) for b in block) + "</p>")
        else:
            out.append(f"<p>{inline(' '.join(b.strip() for b in block))}</p>")

    return "".join(out)


def sql_str(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def build_sql(target: str = "local") -> str:
    rows_chapters = []
    rows_sessions = []

    for ch in CHAPTERS:
        if target == "prod":
            chapter_id = PROD_CHAPTER_IDS[ch["key"]]
        else:
            chapter_id = det_uuid("chapter", ch["key"])
        rows_chapters.append(
            "  ({}, {}, {}, {}, {}, {}, true)".format(
                sql_str(chapter_id),
                sql_str(BOOK_ID),
                sql_str(ch["title"]),
                ch["number"],
                sql_str(ch["description"]),
                ch["number"],
            )
        )

        for n, sess in enumerate(ch["sessions"], start=1):
            path = ROOT / sess["file"]
            if not path.exists():
                sys.exit(f"missing content file: {path}")
            content = convert(path.read_text(encoding="utf-8"))
            if target == "prod":
                session_id = PROD_SESSION_IDS[f"{ch['key']}/{n}"]
            else:
                session_id = det_uuid("session", f"{ch['key']}/{n}")
            rows_sessions.append(
                "  ({}, {}, {}, {}, {}, {}, {}, true, now())".format(
                    sql_str(session_id),
                    sql_str(chapter_id),
                    sql_str(sess["title"]),
                    n,
                    sql_str(sess["scripture"]),
                    sql_str(content),
                    n,
                )
            )

    prologue = ""
    epilogue = ""
    if target == "prod":
        prologue = (
            "BEGIN;\n\n"
            "-- Retire the older combined session (Acts 21:17-22:21) that the new\n"
            "-- chapter-by-chapter sessions supersede. Content is left untouched;\n"
            "-- undo with:  UPDATE public.sessions SET is_published = true,\n"
            "--               session_number = 2, display_order = 2\n"
            f"--             WHERE id = '{PROD_ARCHIVE_SESSION_ID}';\n"
            "UPDATE public.sessions SET\n"
            "  is_published = false,\n"
            f"  session_number = {PROD_ARCHIVE_SESSION_NUMBER},\n"
            f"  display_order = {PROD_ARCHIVE_SESSION_NUMBER}\n"
            f"WHERE id = '{PROD_ARCHIVE_SESSION_ID}';\n"
        )
        epilogue = "\nCOMMIT;\n"

    return prologue + """-- Generated by scripts/publish-content.py — do not edit by hand.
-- Source of truth is content/acts/*.md. Re-run the script to regenerate.
--
-- Acts 21-23 study sessions, adapted from Christ-Centered Exposition Commentary
-- on Acts (pages 334-365), plus an Acts 21-26 context overview.

INSERT INTO public.chapters
  (id, book_id, title, chapter_number, description, display_order, is_published)
VALUES
{chapters}
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  chapter_number = EXCLUDED.chapter_number,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published;

INSERT INTO public.sessions
  (id, chapter_id, title, session_number, scripture_reference, content,
   display_order, is_published, published_at)
VALUES
{sessions}
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  scripture_reference = EXCLUDED.scripture_reference,
  content = EXCLUDED.content,
  session_number = EXCLUDED.session_number,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published;
""".format(
        chapters=",\n".join(rows_chapters),
        sessions=",\n".join(rows_sessions),
    ) + epilogue


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--html-only", metavar="FILE", help="print HTML for one markdown file")
    ap.add_argument("--target", choices=["local", "prod"], default="local")
    ap.add_argument("--out")
    args = ap.parse_args()

    if args.html_only:
        print(convert(Path(args.html_only).read_text(encoding="utf-8")))
        return

    default_out = {
        "local": "supabase/seed_acts_21_26.sql",
        "prod": "supabase/prod_acts_21_23.sql",
    }[args.target]
    out_path = ROOT / (args.out or default_out)
    out_path.write_text(build_sql(args.target), encoding="utf-8")
    print(f"wrote {out_path.relative_to(ROOT)}")
    for ch in CHAPTERS:
        for n, s in enumerate(ch["sessions"], start=1):
            print(f"  ch {ch['number']} session {n}: {s['title']}")


if __name__ == "__main__":
    main()
