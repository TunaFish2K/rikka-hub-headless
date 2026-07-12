/*
 * RikkaHub Headless Mode — Frida Hook Script
 *
 * Goal: Run RikkaHub inside an Android container (Redroid) without UI/Firebase/Play-Services.
 * Strategy:
 *   1. Stub all Firebase RemoteConfig calls (no Play Services available)
 *   2. Bypass Android permission checks for POST_NOTIFICATIONS / ACCESS_LOCAL_NETWORK
 *   3. Bypass foreground-service notification APIs (no notification UI in container)
 *   4. Short-circuit RouteActivity.onCreate so Compose rendering never runs
 *   5. Directly call WebServerManager.start(port, name, localhostOnly=false) after
 *      Application.onCreate finishes, bypassing the default `webServerEnabled=false`
 *      gate and the `startForegroundService()` permission check entirely.
 *
 * Usage:
 *   frida -U -f me.rerere.rikkahub.debug -l rikkahub-headless.js --no-pause
 *
 * Override port via env-like arg (Frida 16+):
 *   frida -U -f me.rerere.rikkahub.debug -l rikkahub-headless.js \
 *         --no-pause -O config.json   # {"PORT": 8080}
 *
 * If future Kotlin/ART versions break the final-field reflection path, the
 * direct-call path supersedes it; field patching is kept only as a secondary
 * belt-and-suspenders for users who want `settings.webServerEnabled == true`
 * to also reflect in the UI exports/backup.
 */

'use strict';

// Defaults — override via runtime.variables.PORT / SERVICE_NAME if running
// under `frida -O config.json`, otherwise via FRIDA_HOOK_PORT env-like const here.
var PORT = 8080;
var SERVICE_NAME = 'rikkahub';
var LOCALHOST_ONLY = false;
var PACKAGE = 'me.rerere.rikkahub.debug';

console.log('[RikkaHub-Headless] script loaded, target port=' + PORT);

// ============================================================================
// H1-H3: FirebaseRemoteConfig → no-op
// ============================================================================
function hookFirebaseRemoteConfig() {
  try {
    var FRC = Java.use('com.google.firebase.remoteconfig.FirebaseRemoteConfig');
    var Tasks = Java.use('com.google.android.gms.tasks.Tasks');

    // setConfigSettingsAsync(FirebaseRemoteConfigSettings) → Task<Void>
    FRC.setConfigSettingsAsync.implementation = function(settings) {
      console.log('[Hook] FRC.setConfigSettingsAsync skipped');
      return Tasks.forResult(null);
    };

    // setDefaultsAsync(int) → Task<Void>
    FRC.setDefaultsAsync.overload('int').implementation = function(xmlRes) {
      console.log('[Hook] FRC.setDefaultsAsync(int) skipped');
      return Tasks.forResult(null);
    };

    // fetchAndActivate() → Task<Boolean>
    FRC.fetchAndActivate.implementation = function() {
      console.log('[Hook] FRC.fetchAndActivate skipped');
      return Tasks.forResult(Java.use('java.lang.Boolean').TRUE);
    };

    console.log('[RikkaHub-Headless] H1-H3 FirebaseRemoteConfig hooks installed');
  } catch (e) {
    console.log('[RikkaHub-Headless] FRC hook skipped: ' + e);
  }
}

// ============================================================================
// H4: ContextCompat.checkSelfPermission → PERMISSION_GRANTED (0)
// ============================================================================
function hookPermissionCheck() {
  try {
    var CC = Java.use('androidx.core.content.ContextCompat');
    CC.checkSelfPermission.implementation = function(ctx, perm) {
      console.log('[Hook] checkSelfPermission returns GRANTED for ' + perm);
      return 0; // PackageManager.PERMISSION_GRANTED
    };
    console.log('[RikkaHub-Headless] H4 permission hook installed');
  } catch (e) {
    console.log('[RikkaHub-Headless] H4 hook skipped: ' + e);
  }
}

// ============================================================================
// H6-H7: ServiceCompat.startForeground + Service.startForeground → no-op
// Container has no NotificationManager UI; calling these may throw.
// ============================================================================
function hookStartForeground() {
  // H6: androidx.core.app.ServiceCompat.startForeground(...)
  try {
    var SC = Java.use('androidx.core.app.ServiceCompat');
    var overloads = SC.startForeground.overloads;
    overloads.forEach(function(ov) {
      ov.implementation = function() {
        console.log('[Hook] ServiceCompat.startForeground skipped');
      };
    });
    console.log('[RikkaHub-Headless] H6 ServiceCompat.startForeground hooked (' + overloads.length + ' overloads)');
  } catch (e) {
    console.log('[RikkaHub-Headless] H6 hook skipped: ' + e);
  }

  // H7: android.app.Service.startForeground(int, Notification)
  try {
    var Service = Java.use('android.app.Service');
    Service.startForeground.overload('int', 'android.app.Notification').implementation = function() {
      console.log('[Hook] Service.startForeground skipped');
    };
    console.log('[RikkaHub-Headless] H7 Service.startForeground hooked');
  } catch (e) {
    console.log('[RikkaHub-Headless] H7 hook skipped: ' + e);
  }
}

// ============================================================================
// H8: RouteActivity.onCreate → finish() immediately
// Prevents Compose rendering from crashing when no GPU/Surface is available.
// ============================================================================
function hookRouteActivity() {
  try {
    var RouteActivity = Java.use(PACKAGE.replace('.debug', '') + '.RouteActivity');
    RouteActivity.onCreate.overload('android.os.Bundle').implementation = function(bundle) {
      console.log('[Hook] RouteActivity.onCreate intercepted, finishing immediately');
      // Call super.onCreate to keep Android lifecycle consistent, then finish.
      // We cannot easily call super from Frida; just finish() and return.
      try { this.super.$onCreate(bundle); } catch (_) { /* ignore */ }
      this.finish();
    };
    console.log('[RikkaHub-Headless] H8 RouteActivity hook installed');
  } catch (e) {
    console.log('[RikkaHub-Headless] H8 RouteActivity hook skipped: ' + e);
  }
}

// ============================================================================
// H9 (conditional): ProcessLifecycleOwner mock
// ChatService.kt:209 registers a lifecycle observer; if Activity never starts,
// this may return null. Hook only if needed.
// ============================================================================
function hookProcessLifecycleOwner() {
  try {
    var PLO = Java.use('androidx.lifecycle.ProcessLifecycleOwner');
    PLO.get.implementation = function() {
      console.log('[Hook] ProcessLifecycleOwner.get() called');
      // Return the real instance; if it crashes, replace with a no-op LifecycleOwner
      return this.get();
    };
    console.log('[RikkaHub-Headless] H9 ProcessLifecycleOwner hooked (pass-through)');
  } catch (e) {
    console.log('[RikkaHub-Headless] H9 hook skipped (will rely on default): ' + e);
  }
}

// ============================================================================
// H5 (auxiliary): Patch Settings.webServerEnabled final field for UI/backup consistency
// Primary mechanism is the direct-call below; this is belt-and-suspenders.
// ============================================================================
function patchSettingsWebServerEnabled(settingsInstance) {
  try {
    var Settings = Java.use('me.rerere.rikkahub.data.datastore.Settings');
    var Field = Java.use('java.lang.reflect.Field');
    var Modifiers = Java.use('java.lang.reflect.Modifier');

    var f = Settings.class.getDeclaredField('webServerEnabled');
    f.setAccessible(true);

    // Clear FINAL bit so we can write to it.
    var modifiersField = Java.use('java.lang.reflect.Field').class.getDeclaredField('accessFlags');
    modifiersField.setAccessible(true);
    var mod = f.getModifiers();
    modifiersField.setInt(f, mod & ~Modifiers.FINAL);

    f.setBoolean(settingsInstance, true);
    console.log('[Hook] Settings.webServerEnabled patched to true');
  } catch (e) {
    console.log('[Hook] Settings.webServerEnabled patch FAILED: ' + e);
  }
}

// Try to install the H5 patch on every Settings instance seen
function installSettingsInstanceHook() {
  try {
    var Settings = Java.use('me.rerere.rikkahub.data.datastore.Settings');
    // Hook every constructor (data class generates one primary constructor)
    var ctors = Settings.class.getConstructors();
    ctors.forEach(function(ctor) {
      var paramTypes = ctor.getParameterTypes();
      // Generic: wrap constructor via Java.choose pattern at use site instead,
      // since Frida doesn't directly support ctor overload arrays by signature easily.
    });

    // Simpler: hook all $init overloads
    Settings.$init.overloads.forEach(function(ov) {
      ov.implementation = function() {
        var inst = ov.apply(this, arguments);
        try { patchSettingsWebServerEnabled(inst); } catch (_) {}
        return inst;
      };
    });
    console.log('[RikkaHub-Headless] H5 Settings $init hook installed');
  } catch (e) {
    console.log('[RikkaHub-Headless] H5 Settings hook skipped: ' + e);
  }
}

// ============================================================================
// Primary mechanism: find WebServerManager instance via Java.choose (heap walk)
// and call .start(PORT, SERVICE_NAME, LOCALHOST_ONLY). Koin instantiates
// WebServerManager eagerly in the root scope at app init, so by the time this
// runs, exactly one instance exists.
// ============================================================================
function startWebServerDirectly(attempt) {
  attempt = attempt || 0;
  setTimeout(function() {
    Java.perform(function() {
      try {
        var WSM_CLASS = Java.use('me.rerere.rikkahub.web.WebServerManager');
        var found = false;
        Java.choose('me.rerere.rikkahub.web.WebServerManager', {
          onMatch: function(inst) {
            if (found) return;
            found = true;
            try {
              inst.start.overload('int', 'java.lang.String', 'boolean')
                    .call(inst, PORT, SERVICE_NAME, LOCALHOST_ONLY);
              console.log('[RikkaHub-Headless] WebServerManager.start() invoked on instance, port=' + PORT);
            } catch (e1) {
              // Fall back to varargs-style call
              try {
                inst.start(PORT, SERVICE_NAME, LOCALHOST_ONLY);
                console.log('[RikkaHub-Headless] start() varargs call OK');
              } catch (e2) {
                console.log('[RikkaHub-Headless] start() invocations failed: ' + e1 + ' / ' + e2);
              }
            }
          },
          onComplete: function() {
            if (!found) {
              console.log('[RikkaHub-Headless] no WebServerManager instance yet; attempt=' + attempt);
              if (attempt < 8) startWebServerDirectly(attempt + 1);
            }
          }
        });
      } catch (e) {
        console.log('[RikkaHub-Headless] direct-start error: ' + e);
        if (attempt < 8) startWebServerDirectly(attempt + 1);
      }
    });
  }, 1500 + attempt * 1500); // 1.5s, 3s, 4.5s, ... up to 12s
}

// ============================================================================
// Boot sequence
// ============================================================================
Java.perform(function() {
  console.log('[RikkaHub-Headless] installing hooks...');

  hookFirebaseRemoteConfig();      // H1-H3
  hookPermissionCheck();            // H4
  // H6/H7 disabled: no-op'ing startForeground makes the system-level AMS time out the
  // FGS at 30s with ForegroundServiceDidNotStartInTimeException. The container's
  // NotificationManager works (channels were already created in Application.onCreate),
  // so the real call through to startForeground is fine.
  // hookStartForeground();
  // H8 RouteActivity hook disabled: see explanation above.
  // hookRouteActivity();
  hookProcessLifecycleOwner();      // H9 (pass-through)

  // H5 is belt-and-suspenders; primary path is direct-call below
  installSettingsInstanceHook();

  // Primary mechanism: invoke WebServerManager.start() directly.
  startWebServerDirectly();

  console.log('[RikkaHub-Headless] hooks installed, waiting 1.5s for Koin before direct-start');
});
