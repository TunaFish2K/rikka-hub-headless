#!/usr/bin/env bash
# entrypoint.sh — Run inside manager container, orchestrates RikkaHub headless.
#
# Environment variables (all optional):
#   REDROID_HOST  (default: rikkahub-redroid)
#   PORT          (default: 8080)
#   PACKAGE       (default: me.rerere.rikkahub.debug)
#   APK_PATH      (default: /apk/app-debug.apk)
#   MAX_FAILS     (default: 3)
set -uo pipefail

REDROID_HOST="${REDROID_HOST:-rikkahub-redroid}"
PORT="${PORT:-8080}"
PACKAGE="${PACKAGE:-me.rerere.rikkahub.debug}"
APK_PATH="${APK_PATH:-/opt/rikkahub.apk}"
HOOK_SCRIPT="${HOOK_SCRIPT:-/opt/frida/rikkahub-headless.js}"
MAX_FAILS="${MAX_FAILS:-3}"

ADB_TARGET="${REDROID_HOST}:5555"
FRIDA_TARGET="${REDROID_HOST}:27042"
HEALTH_URL="http://${REDROID_HOST}:${PORT}/"
ACTIVITY="${PACKAGE}/me.rerere.rikkahub.RouteActivity"

log() { echo "[$(date '+%F %T')] $*"; }

cleanup() {
  log "cleanup: killing Frida runner and force-stopping app"
  pkill -f "run.py" 2>/dev/null || true
  adb -s "$ADB_TARGET" shell am force-stop "$PACKAGE" >/dev/null 2>&1 || true
}
trap 'cleanup; exit 0' TERM INT

wait_for_adb() {
  log "waiting for ADB at $ADB_TARGET ..."
  for i in $(seq 1 60); do
    adb connect "$ADB_TARGET" >/dev/null 2>&1
    if adb -s "$ADB_TARGET" get-state >/dev/null 2>&1; then
      log "ADB ready"
      return 0
    fi
    sleep 2
  done
  log "ERROR: ADB not reachable after 120s"
  return 1
}

setup_frida_server() {
  adb -s "$ADB_TARGET" root >/dev/null 2>&1 || true
  sleep 1

  if adb -s "$ADB_TARGET" shell pgrep -f frida-server >/dev/null 2>&1; then
    log "frida-server already running"
    return 0
  fi

  log "pushing frida-server ..."
  adb -s "$ADB_TARGET" push /usr/local/bin/frida-server /data/local/tmp/frida-server
  adb -s "$ADB_TARGET" shell chmod +x /data/local/tmp/frida-server

  log "starting frida-server ..."
  adb -s "$ADB_TARGET" shell "nohup /data/local/tmp/frida-server -D -l 0.0.0.0:27042 >/data/local/tmp/frida.log 2>&1 &"
  sleep 2

  if ! adb -s "$ADB_TARGET" shell pgrep -f frida-server >/dev/null 2>&1; then
    log "ERROR: frida-server failed to start"
    return 1
  fi
  log "frida-server started"
}

install_apk() {
  local expected_version installed_version expected_hash installed_hash hash_file
  expected_version="$(cat /opt/rikkahub-version)"
  installed_version="$(adb -s "$ADB_TARGET" shell dumpsys package "$PACKAGE" 2>/dev/null | sed -n 's/.*versionName=//p' | head -1 | tr -d '\r')"
  expected_hash="$(sha256sum "$APK_PATH" | cut -d' ' -f1)"
  hash_file="/data/local/tmp/rikkahub-${PACKAGE}.sha256"
  installed_hash="$(adb -s "$ADB_TARGET" shell cat "$hash_file" 2>/dev/null | tr -d '\r')"
  if [ "$installed_version" = "$expected_version" ] && [ "$installed_hash" = "$expected_hash" ]; then
    log "APK $expected_version ($expected_hash) already installed"
    return 0
  fi
  log "installing APK $expected_version (installed: ${installed_version:-none}, hash changed)"
  adb -s "$ADB_TARGET" install -r "$APK_PATH"
  adb -s "$ADB_TARGET" shell "printf '%s' '$expected_hash' > '$hash_file'"
}

run_bootstrap() {
  cleanup

  wait_for_adb || return 1
  setup_frida_server || return 1
  install_apk

  log "launching $ACTIVITY ..."
  adb -s "$ADB_TARGET" shell am start -n "$ACTIVITY" >/dev/null 2>&1

  log "starting Frida hook runner ..."
  FRIDA_HOST="$FRIDA_TARGET" PACKAGE="$PACKAGE" HOOK_SCRIPT="$HOOK_SCRIPT" \
    nohup python3 /opt/frida/run.py > /logs/runner.log 2>&1 &
  RUNNER_PID=$!
  echo "$RUNNER_PID" > /logs/runner.pid
  log "runner PID $RUNNER_PID"
  sleep 8

  log "sending WEB_SERVER_START intent ..."
  adb -s "$ADB_TARGET" shell am start-foreground-service \
    -n "${PACKAGE}/me.rerere.rikkahub.service.WebServerService" \
    -a "me.rerere.rikkahub.action.WEB_SERVER_START" \
    --ei port "$PORT" \
    --ez localhost_only false >/dev/null 2>&1
}

health_check_loop() {
  local fails=0
  while true; do
    if curl -sf -o /dev/null --max-time 3 "$HEALTH_URL"; then
      if [ "$fails" -gt 0 ]; then
        log "health: recovered"
        fails=0
      fi
      sleep 60
    else
      fails=$((fails + 1))
      log "health: fail $fails/$MAX_FAILS"
      if [ "$fails" -ge "$MAX_FAILS" ]; then
        log "health: restarting"
        return 1
      fi
      sleep 10
    fi
  done
}

log "=== RikkaHub manager started ==="
log "  redroid: $REDROID_HOST"
log "  port:    $PORT"
log "  package: $PACKAGE"
log "  apk:     $APK_PATH"

while true; do
  run_bootstrap
  if [ $? -ne 0 ]; then
    log "bootstrap failed, retrying in 30s ..."
    sleep 30
    continue
  fi

  log "health check loop started (max $MAX_FAILS failures)"
  health_check_loop || true

  log "restarting ..."
  sleep 5
done
