#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT="$ROOT/deploy/headless/apk"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/.local/share/android-sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
if [[ -z "${JAVA_HOME:-}" && -d /usr/lib/jvm/java-21-openjdk ]]; then
  export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
fi
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
KEYSTORE_DIR="${RIKKAHUB_KEYSTORE_DIR:-$HOME/.local/share/rikkahub-headless}"
KEYSTORE_FILE="${RIKKAHUB_KEYSTORE_FILE:-$KEYSTORE_DIR/headless-debug.jks}"
KEYSTORE_PASSWORD="${RIKKAHUB_KEYSTORE_PASSWORD:-changeit}"
KEY_ALIAS="${RIKKAHUB_KEY_ALIAS:-rikkahub-headless}"
KEY_PASSWORD="${RIKKAHUB_KEY_PASSWORD:-$KEYSTORE_PASSWORD}"
GOOGLE_SERVICES="$ROOT/app/google-services.json"
CREATED_GOOGLE_SERVICES=0

command -v keytool >/dev/null || { echo "ERROR: keytool is required" >&2; exit 1; }
command -v pnpm >/dev/null || { echo "ERROR: pnpm is required" >&2; exit 1; }

mkdir -p "$KEYSTORE_DIR" "$OUT"
if [[ ! -f "$KEYSTORE_FILE" ]]; then
  keytool -genkeypair -noprompt -keystore "$KEYSTORE_FILE" -storepass "$KEYSTORE_PASSWORD" \
    -alias "$KEY_ALIAS" -keypass "$KEY_PASSWORD" -keyalg RSA -keysize 3072 -validity 36500 \
    -dname "CN=RikkaHub Headless, OU=Headless, O=RikkaHub, L=Unknown, ST=Unknown, C=US"
  chmod 600 "$KEYSTORE_FILE"
  echo "Created persistent signing key: $KEYSTORE_FILE"
fi

cleanup() {
  if [[ "$CREATED_GOOGLE_SERVICES" == 1 ]]; then rm -f "$GOOGLE_SERVICES"; fi
}
trap cleanup EXIT

if [[ ! -f "$GOOGLE_SERVICES" ]]; then
  printf '%s' '{"project_info":{"project_number":"0","project_id":"rikkahub-headless","storage_bucket":"rikkahub-headless.invalid"},"client":[{"client_info":{"mobilesdk_app_id":"1:0:android:headless","android_client_info":{"package_name":"me.rerere.rikkahub.debug"}},"api_key":[{"current_key":"headless"}]}],"configuration_version":"1"}' > "$GOOGLE_SERVICES"
  CREATED_GOOGLE_SERVICES=1
fi

export RIKKAHUB_KEYSTORE_FILE="$KEYSTORE_FILE"
export RIKKAHUB_KEYSTORE_PASSWORD="$KEYSTORE_PASSWORD"
export RIKKAHUB_KEY_ALIAS="$KEY_ALIAS"
export RIKKAHUB_KEY_PASSWORD="$KEY_PASSWORD"

cd "$ROOT"
pnpm --dir web-ui install --frozen-lockfile
./gradlew :app:assembleDebug --no-daemon

APK="$(find app/build/outputs/apk/debug -name '*universal*.apk' -print -quit)"
[[ -n "$APK" && -s "$APK" ]] || { echo "ERROR: universal debug APK not found" >&2; exit 1; }
cp "$APK" "$OUT/rikkahub.apk"
sed -n 's/.*versionName = "\([^"]*\)".*/\1/p' app/build.gradle.kts | head -1 > "$OUT/rikkahub-version"
(cd "$OUT" && sha256sum rikkahub.apk > rikkahub.apk.sha256)
echo "APK ready: $OUT/rikkahub.apk"
