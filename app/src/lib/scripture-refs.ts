/**
 * Scripture reference detection for study content.
 *
 * Study notes adapted from commentaries use standard scholarly abbreviations
 * ("Rom 10:4", "1 Cor 9:22-23", "Exod 3:15-16"), not spelled-out book names, so
 * detection has to accept both. Display text is always kept exactly as written
 * in the content; only the string sent to the ESV API is normalized.
 */

/** Canonical book name -> every spelling we accept for it. */
const BOOK_ALIASES: Record<string, string[]> = {
  Genesis: ['Genesis', 'Gen'],
  Exodus: ['Exodus', 'Exod'],
  Leviticus: ['Leviticus', 'Lev'],
  Numbers: ['Numbers', 'Num'],
  Deuteronomy: ['Deuteronomy', 'Deut'],
  Joshua: ['Joshua', 'Josh'],
  Judges: ['Judges', 'Judg'],
  Ruth: ['Ruth'],
  '1 Samuel': ['1 Samuel', '1 Sam'],
  '2 Samuel': ['2 Samuel', '2 Sam'],
  '1 Kings': ['1 Kings', '1 Kgs'],
  '2 Kings': ['2 Kings', '2 Kgs'],
  '1 Chronicles': ['1 Chronicles', '1 Chron', '1 Chr'],
  '2 Chronicles': ['2 Chronicles', '2 Chron', '2 Chr'],
  Ezra: ['Ezra'],
  Nehemiah: ['Nehemiah', 'Neh'],
  Esther: ['Esther', 'Esth'],
  Job: ['Job'],
  Psalms: ['Psalms', 'Psalm', 'Pss', 'Ps'],
  Proverbs: ['Proverbs', 'Prov'],
  Ecclesiastes: ['Ecclesiastes', 'Eccl'],
  'Song of Solomon': ['Song of Solomon', 'Song of Songs', 'Song'],
  Isaiah: ['Isaiah', 'Isa'],
  Jeremiah: ['Jeremiah', 'Jer'],
  Lamentations: ['Lamentations', 'Lam'],
  Ezekiel: ['Ezekiel', 'Ezek'],
  Daniel: ['Daniel', 'Dan'],
  Hosea: ['Hosea', 'Hos'],
  Joel: ['Joel'],
  Amos: ['Amos'],
  Obadiah: ['Obadiah', 'Obad'],
  Jonah: ['Jonah'],
  Micah: ['Micah', 'Mic'],
  Nahum: ['Nahum', 'Nah'],
  Habakkuk: ['Habakkuk', 'Hab'],
  Zephaniah: ['Zephaniah', 'Zeph'],
  Haggai: ['Haggai', 'Hag'],
  Zechariah: ['Zechariah', 'Zech'],
  Malachi: ['Malachi', 'Mal'],
  Matthew: ['Matthew', 'Matt'],
  Mark: ['Mark'],
  Luke: ['Luke'],
  John: ['John'],
  Acts: ['Acts'],
  Romans: ['Romans', 'Rom'],
  '1 Corinthians': ['1 Corinthians', '1 Cor'],
  '2 Corinthians': ['2 Corinthians', '2 Cor'],
  Galatians: ['Galatians', 'Gal'],
  Ephesians: ['Ephesians', 'Eph'],
  Philippians: ['Philippians', 'Phil'],
  Colossians: ['Colossians', 'Col'],
  '1 Thessalonians': ['1 Thessalonians', '1 Thess'],
  '2 Thessalonians': ['2 Thessalonians', '2 Thess'],
  '1 Timothy': ['1 Timothy', '1 Tim'],
  '2 Timothy': ['2 Timothy', '2 Tim'],
  Titus: ['Titus'],
  Philemon: ['Philemon', 'Philem', 'Phlm'],
  Hebrews: ['Hebrews', 'Heb'],
  James: ['James', 'Jas'],
  '1 Peter': ['1 Peter', '1 Pet'],
  '2 Peter': ['2 Peter', '2 Pet'],
  '1 John': ['1 John'],
  '2 John': ['2 John'],
  '3 John': ['3 John'],
  Jude: ['Jude'],
  Revelation: ['Revelation', 'Rev'],
}

/**
 * Chapters per book. Used to reject book-less references that cannot belong to
 * the surrounding book: an Acts session quoting "(103:2 ESV)" is quoting a
 * psalm, not Acts 103, so it must be left as plain text rather than linked to a
 * passage that does not exist.
 *
 * Checksum in the tests: 929 OT + 260 NT = 1189.
 */
const CHAPTER_COUNTS: Record<string, number> = {
  Genesis: 50, Exodus: 40, Leviticus: 27, Numbers: 36, Deuteronomy: 34,
  Joshua: 24, Judges: 21, Ruth: 4, '1 Samuel': 31, '2 Samuel': 24,
  '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36,
  Ezra: 10, Nehemiah: 13, Esther: 10, Job: 42, Psalms: 150, Proverbs: 31,
  Ecclesiastes: 12, 'Song of Solomon': 8, Isaiah: 66, Jeremiah: 52,
  Lamentations: 5, Ezekiel: 48, Daniel: 12, Hosea: 14, Joel: 3, Amos: 9,
  Obadiah: 1, Jonah: 4, Micah: 7, Nahum: 3, Habakkuk: 3, Zephaniah: 3,
  Haggai: 2, Zechariah: 14, Malachi: 4,
  Matthew: 28, Mark: 16, Luke: 24, John: 21, Acts: 28, Romans: 16,
  '1 Corinthians': 16, '2 Corinthians': 13, Galatians: 6, Ephesians: 6,
  Philippians: 4, Colossians: 4, '1 Thessalonians': 5, '2 Thessalonians': 3,
  '1 Timothy': 6, '2 Timothy': 4, Titus: 3, Philemon: 1, Hebrews: 13,
  James: 5, '1 Peter': 5, '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1,
  Jude: 1, Revelation: 22,
}

/** alias (lowercased, whitespace collapsed) -> canonical book name */
const ALIAS_TO_CANONICAL = new Map<string, string>()
for (const [canonical, aliases] of Object.entries(BOOK_ALIASES)) {
  for (const alias of aliases) {
    ALIAS_TO_CANONICAL.set(alias.toLowerCase().replace(/\s+/g, ' '), canonical)
  }
}

// Longest spelling first so "Philippians" wins over "Philemon" over "Phil",
// and "1 Corinthians" over "1 Cor". Numbered books allow an optional space
// ("1Cor"), and any abbreviation may carry a trailing period ("Rom." / "1 Cor.").
const BOOK_PATTERN = Object.values(BOOK_ALIASES)
  .flat()
  .sort((a, b) => b.length - a.length)
  .map((name) => name.replace(/^([1-3]) /, '$1\\s*').replace(/ /g, '\\s+'))
  .join('|')

// One reference only. Deliberately stops at ";" so a list like
// "Acts 11:27-30; 20:35; 2 Cor 8:9" yields separate links instead of a single
// mashed-together string that the ESV API cannot resolve.
//   21              chapter
//   14-15           chapter range
//   21:17-40        verse range
//   21:17-22:21     cross-chapter range
//   11:18,22-23     verse list
// A verse number, optionally with a half-verse marker: "20", "20a", "20b" as in
// "21:20b-26". The lookahead stops it eating ordinary words ("20about"). Markers
// are shown but stripped before lookup — the ESV API takes verses, not halves.
const V = '\\d+(?:[ab](?![a-z]))?'

// "and following": "16:22f.", "3:21ff."
const FF_PATTERN = '(?:ff?(?![a-z])\\.?)?'

const NUMBERS_PATTERN =
  `\\d+(?::${V}(?:\\s*[–-]\\s*${V}(?::${V})?)?(?:,\\s*${V}(?:\\s*[–-]\\s*${V})?)*` +
  `|\\s*[–-]\\s*\\d+)?` +
  FF_PATTERN

// Within a chain like "Acts 11:18,22-23; 14:27; 15:12", the entries after the
// first carry no book name — the previous book is implied. Anchored at the end
// of a match, this picks up one such entry.
const CONTINUATION_PATTERN = `^\\s*;\\s*(${NUMBERS_PATTERN})`

// A reference with its own book name, anchored at the start of the string. Used
// to reject false continuations: in "Acts 15; 1 Pet 3:15" the "1" belongs to
// "1 Peter", so it must not be read as chapter 1 of Acts. Checking for a whole
// reference (rather than a bare book alias) is what catches this — "Pet" on its
// own is not an alias, only "1 Pet" is.
const ANCHORED_REF_PATTERN = `^(${BOOK_PATTERN})\\.?\\s+(${NUMBERS_PATTERN})`

// A reference written with no book at all, e.g. "(21:40; cf. 22:2; 26:14)" in an
// Acts study. A colon is required: bare chapter numbers are indistinguishable
// from verse numbers ("v. 29"), page numbers, and ordinary prose, so only
// chapter:verse forms are safe to resolve against the surrounding book.
const BOOKLESS_PATTERN =
  `\\d+:${V}(?:\\s*[–-]\\s*${V}(?::${V})?)?(?:,\\s*${V}(?:\\s*[–-]\\s*${V})?)*` + FF_PATTERN

export interface ScriptureMatch {
  /** Exactly as it appears in the content, e.g. "1 Cor 9:22-23". */
  display: string
  /** Normalized for the ESV API, e.g. "1 Corinthians 9:22-23". */
  canonical: string
  start: number
  end: number
}

/**
 * A fresh regex per call — a shared /g regex carries `lastIndex` between calls,
 * which silently skips matches.
 */
export function scriptureRegex(): RegExp {
  return new RegExp(`\\b(${BOOK_PATTERN})\\.?\\s+(${NUMBERS_PATTERN})`, 'gi')
}

/** Drop half-verse markers and "f."/"ff.", which the ESV API cannot resolve. */
function forLookup(numbers: string): string {
  return numbers
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/ff?\.?$/i, '')
    .replace(/(\d)[ab](?![\d])/gi, '$1')
    .trim()
}

export function toCanonicalReference(book: string, numbers: string): string {
  const key = book.toLowerCase().replace(/\.$/, '').replace(/\s+/g, ' ').trim()
  const canonical =
    ALIAS_TO_CANONICAL.get(key) ??
    // "1Cor" style with no space
    ALIAS_TO_CANONICAL.get(key.replace(/^([1-3])\s*/, '$1 ')) ??
    book
  return `${canonical} ${forLookup(numbers)}`
}

/** Canonical book name for a session's scripture_reference, e.g. "Acts 22" -> "Acts". */
export function bookFromReference(reference: string | null | undefined): string | undefined {
  if (!reference) return undefined
  const m = reference.match(new RegExp(`^\\s*(${BOOK_PATTERN})\\b`, 'i'))
  if (!m) return undefined
  const key = m[1].toLowerCase().replace(/\s+/g, ' ').trim()
  return (
    ALIAS_TO_CANONICAL.get(key) ??
    ALIAS_TO_CANONICAL.get(key.replace(/^([1-3])\s*/, '$1 '))
  )
}

/**
 * Find every scripture reference in a plain-text string.
 *
 * `defaultBook` must be a canonical book name (see `bookFromReference`). When
 * given, book-less references such as "22:2" resolve against it, but only if
 * that chapter actually exists in that book.
 */
export function findScriptureRefs(text: string, defaultBook?: string): ScriptureMatch[] {
  const regex = scriptureRegex()
  const out: ScriptureMatch[] = []
  let match: RegExpExecArray | null

  const continuation = new RegExp(CONTINUATION_PATTERN, 'i')
  const anchoredRef = new RegExp(ANCHORED_REF_PATTERN, 'i')

  while ((match = regex.exec(text)) !== null) {
    const book = match[1]
    let end = match.index + match[0].length

    out.push({
      display: match[0].trim(),
      canonical: toCanonicalReference(book, match[2]),
      start: match.index,
      end,
    })

    // Trailing entries of the same chain inherit this reference's book.
    let cont: RegExpMatchArray | null
    while ((cont = text.slice(end).match(continuation)) !== null) {
      const offset = cont[0].length - cont[0].trimStart().length
      const numbers = cont[1]
      const start = end + cont[0].indexOf(numbers, offset)

      // Not a continuation but the next book's own reference — leave it to the
      // main regex so it keeps its book name.
      if (anchoredRef.test(text.slice(start))) break

      out.push({
        display: numbers.trim(),
        canonical: toCanonicalReference(book, numbers),
        start,
        end: start + numbers.length,
      })
      end = start + numbers.length
    }

    regex.lastIndex = end
  }

  const maxChapter = defaultBook ? CHAPTER_COUNTS[defaultBook] : undefined
  if (!maxChapter) return out

  const bookless = new RegExp(BOOKLESS_PATTERN, 'g')
  while ((match = bookless.exec(text)) !== null) {
    const start = match.index
    const end = start + match[0].length

    // Skip anything already inside a reference found above — most book-less
    // matches are the number part of "Acts 22:2" or of a chain continuation.
    if (out.some((r) => start < r.end && end > r.start)) continue

    // Reject mid-number and mid-word hits (a ":" or digit either side means this
    // is a fragment, a letter means it is part of a word).
    if (/[\w:.]/.test(text[start - 1] ?? '')) continue
    if (/[\w:]/.test(text[end] ?? '')) continue

    if (Number(match[0].split(':')[0]) > maxChapter) continue

    out.push({
      display: match[0],
      canonical: `${defaultBook} ${forLookup(match[0])}`,
      start,
      end,
    })
  }

  return out.sort((a, b) => a.start - b.start)
}
