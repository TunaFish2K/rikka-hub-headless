#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION="$(cat "$DIR/apk/rikkahub-version")"
OUT="${1:-$DIR/rikkahub-headless-$VERSION.tar.gz}"

(cd "$DIR/../.." && tar -czf "$OUT" \
  deploy/headless/docker-compose.yml \
  deploy/headless/README.md \
  deploy/headless/manager \
  deploy/headless/frida \
  deploy/headless/apk/rikkahub.apk \
  deploy/headless/apk/rikkahub-version \
  deploy/headless/apk/rikkahub.apk.sha256 \
  .dockerignore)
sha256sum "$OUT" > "$OUT.sha256"
echo "Deployment bundle ready: $OUT"
