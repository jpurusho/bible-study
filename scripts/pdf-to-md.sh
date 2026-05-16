#!/bin/bash
# Convert PDF to Markdown (text extraction + cleanup)
# Usage: ./scripts/pdf-to-md.sh input.pdf [output.md]
#
# For best results with slide-heavy PDFs:
#   1. Export Keynote → PDF first
#   2. Run this script
#   3. Review and clean up the output
#   4. Paste into admin editor via "Import Markdown" button
#
# Dependencies: pdftotext (brew install poppler)

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <input.pdf> [output.md]"
  echo ""
  echo "Examples:"
  echo "  $0 slides.pdf                    → outputs slides.md"
  echo "  $0 slides.pdf session-notes.md   → outputs session-notes.md"
  exit 1
fi

INPUT="$1"
OUTPUT="${2:-${INPUT%.pdf}.md}"

if [ ! -f "$INPUT" ]; then
  echo "Error: File not found: $INPUT"
  exit 1
fi

echo "Converting: $INPUT → $OUTPUT"

pandoc "$INPUT" \
  -o "$OUTPUT" \
  --wrap=none \
  --extract-media=./media \
  --markdown-headings=atx

# Post-process: clean up common pandoc artifacts
sed -i '' \
  -e 's/\\$//' \
  -e '/^$/N;/^\n$/d' \
  "$OUTPUT" 2>/dev/null || true

echo "Done! Output: $OUTPUT"
echo ""
echo "Next steps:"
echo "  1. Review $OUTPUT in vim/editor"
echo "  2. Clean up formatting if needed"
echo "  3. Copy-paste into the TipTap editor in the app"
echo "  4. If images were extracted, they're in ./media/"
echo "     Upload them to Google Drive and update the image URLs"
