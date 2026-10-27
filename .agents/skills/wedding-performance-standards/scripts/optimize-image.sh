#!/usr/bin/env bash
# Helper script to convert images to production-standard WebP format
# Usage: ./optimize-image.sh <input-image-path> [quality: default 82] [max-width: optional]

set -e

INPUT="$1"
QUALITY="${2:-82}"
MAX_WIDTH="$3"

if [ -z "$INPUT" ]; then
  echo "Usage: $0 <input-image> [quality (default 82)] [max-width (optional)]"
  echo "Example: $0 ./new-photo.png 82 1600"
  exit 1
fi

if [ ! -f "$INPUT" ]; then
  echo "Error: File '$INPUT' does not exist."
  exit 1
fi

if ! command -v cwebp &> /dev/null; then
  echo "Error: 'cwebp' tool is required. Install with: brew install webp"
  exit 1
fi

DIR=$(dirname "$INPUT")
BASENAME=$(basename "$INPUT")
FILENAME="${BASENAME%.*}"
OUTPUT="$DIR/$FILENAME.webp"

RESIZE_ARGS=""
if [ -n "$MAX_WIDTH" ]; then
  RESIZE_ARGS="-resize $MAX_WIDTH 0"
fi

echo "Converting '$INPUT' to WebP (Quality: $QUALITY)..."
cwebp -q "$QUALITY" $RESIZE_ARGS "$INPUT" -o "$OUTPUT"

ORIGINAL_SIZE=$(wc -c < "$INPUT" | tr -d ' ')
NEW_SIZE=$(wc -c < "$OUTPUT" | tr -d ' ')
SAVINGS=$(( 100 - (NEW_SIZE * 100 / ORIGINAL_SIZE) ))

echo "✅ Saved as: $OUTPUT"
echo "📊 Original: $(ls -lh "$INPUT" | awk '{print $5}') → WebP: $(ls -lh "$OUTPUT" | awk '{print $5}') (${SAVINGS}% reduction)"
