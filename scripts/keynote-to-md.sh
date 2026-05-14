#!/bin/bash
# Convert Keynote to Markdown
# Usage: ./scripts/keynote-to-md.sh input.key [output.md]
#
# This script:
#   1. Exports Keynote → PDF (via macOS automation)
#   2. Converts PDF → Markdown (via pandoc)
#   3. Cleans up formatting
#
# Dependencies: pandoc (brew install pandoc), macOS with Keynote installed

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <input.key> [output.md]"
  echo ""
  echo "Examples:"
  echo "  $0 presentation.key                    → outputs presentation.md"
  echo "  $0 presentation.key session-notes.md   → outputs session-notes.md"
  exit 1
fi

INPUT="$1"
OUTPUT="${2:-${INPUT%.key}.md}"
PDF_TEMP="${INPUT%.key}_temp.pdf"

if [ ! -f "$INPUT" ]; then
  echo "Error: File not found: $INPUT"
  exit 1
fi

echo "Step 1: Exporting Keynote → PDF..."

# Use AppleScript to export Keynote to PDF
osascript -e "
  tell application \"Keynote\"
    set theDoc to open POSIX file \"$(cd "$(dirname "$INPUT")" && pwd)/$(basename "$INPUT")\"
    export theDoc to POSIX file \"$(cd "$(dirname "$INPUT")" && pwd)/${PDF_TEMP}\" as PDF
    close theDoc
  end tell
" 2>/dev/null

if [ ! -f "$PDF_TEMP" ]; then
  echo "Error: PDF export failed. Try exporting manually from Keynote."
  exit 1
fi

echo "Step 2: Converting PDF → Markdown..."

pandoc "$PDF_TEMP" \
  -o "$OUTPUT" \
  --wrap=none \
  --extract-media=./media \
  --markdown-headings=atx

# Clean up temp PDF
rm -f "$PDF_TEMP"

# Post-process
sed -i '' \
  -e 's/\\$//' \
  -e '/^$/N;/^\n$/d' \
  "$OUTPUT" 2>/dev/null || true

echo "Done! Output: $OUTPUT"
echo ""
echo "Next steps:"
echo "  1. Review $OUTPUT in vim/editor"
echo "  2. Keynote slides often convert as flat text — add headings (#, ##)"
echo "  3. Add scripture references as blockquotes (> Acts 1:8...)"
echo "  4. Copy-paste into the TipTap editor in the app"
echo "  5. Images in ./media/ → upload to Google Drive, update URLs"
