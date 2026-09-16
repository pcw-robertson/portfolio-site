#!/usr/bin/env bash
# Compress a raw screen recording into a web-ready MP4 + poster frame.
#
# Usage: scripts/compress-video.sh <input.mov> <output-slug> [output-dir]
#
# Produces:
#   <output-dir>/<output-slug>.mp4
#   <output-dir>/<output-slug>-poster.jpg
#
# Tunable via env vars: MAX_WIDTH, FPS, CRF, WARN_SIZE_MB, POSTER_TIME

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <input.mov> <output-slug> [output-dir]" >&2
  exit 1
fi

INPUT="$1"
SLUG="$2"
OUT_DIR="${3:-public/videos}"

MAX_WIDTH="${MAX_WIDTH:-720}"
FPS="${FPS:-30}"
CRF="${CRF:-28}"
WARN_SIZE_MB="${WARN_SIZE_MB:-3}"
POSTER_TIME="${POSTER_TIME:-0.5}"

if [ ! -f "$INPUT" ]; then
  echo "Input file not found: $INPUT" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

OUT_VIDEO="$OUT_DIR/$SLUG.mp4"
OUT_POSTER="$OUT_DIR/$SLUG-poster.jpg"

echo "Compressing $INPUT -> $OUT_VIDEO"

ffmpeg -y -hide_banner -loglevel error -stats -i "$INPUT" \
  -an \
  -vf "scale='min($MAX_WIDTH,iw)':-2,fps=$FPS" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -crf "$CRF" -preset slow \
  -movflags +faststart \
  "$OUT_VIDEO"

echo "Extracting poster frame at ${POSTER_TIME}s -> $OUT_POSTER"

ffmpeg -y -hide_banner -loglevel error -ss "$POSTER_TIME" -i "$OUT_VIDEO" -vframes 1 -q:v 5 -update 1 "$OUT_POSTER"

SIZE_BYTES=$(stat -f%z "$OUT_VIDEO")
SIZE_MB=$(echo "scale=2; $SIZE_BYTES / 1048576" | bc)

echo ""
echo "Done:"
echo "  $OUT_VIDEO ($SIZE_MB MB)"
echo "  $OUT_POSTER"

if (( $(echo "$SIZE_MB > $WARN_SIZE_MB" | bc -l) )); then
  echo ""
  echo "⚠ ${SIZE_MB}MB exceeds the ${WARN_SIZE_MB}MB guideline for self-hosting."
  echo "  Consider hosting '$SLUG' on Vimeo/YouTube (unlisted) and embedding it instead."
fi
