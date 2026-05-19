# omiGlass — Native Dev Build Guide

Web (`pnpm web`) keeps working with Web Bluetooth; this guide is for
running the **native iOS / Android dev build** so `react-native-ble-plx`
can drive BLE on a real phone.

Expo Go cannot host this app any more (`react-native-ble-plx` is a
native module), so you need a dev client. We build it **locally** —
faster iteration than EAS cloud, no per-build cost, no queue.

---

## Prerequisites (one-time, already satisfied on this machine)

| Tool | Why | Verify |
|---|---|---|
| Java 17 | Android Gradle build | `java -version` → `17.x` |
| Android SDK (via Android Studio) | Native Android build | `$ANDROID_HOME` exists |
| Android platform-tools | `adb` for device install | `which adb` |
| Xcode 26 | iOS native build, required by SDK 55 | `xcodebuild -version` |
| `EXPO_PUBLIC_GROQ_API_KEY` in `.env` | Vision + STT | re-used from Phase 0 |

If `adb` is missing from `PATH`, add to your shell rc (`~/.zshrc`):

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
```

Then `source ~/.zshrc`.

---

## Android — local build (recommended first target)

### 1. Connect the phone over USB

- Enable Developer Options (tap "Build number" 7 times in Settings → About).
- Enable USB Debugging.
- Plug into the Mac; accept the RSA fingerprint prompt that appears
  on the phone.
- Verify:

```bash
adb devices
# List of devices attached
# 1A2B3C4D5E   device      ← good. "unauthorized" means tap "Allow" on the phone.
```

### 2. Generate native android/ folder

```bash
cd omiGlass
pnpm dlx expo prebuild --platform android --clean
```

This creates `omiGlass/android/` with the native Gradle project,
applying the `app.json` permissions / plugin config / scheme.

### 3. Build + install + launch

```bash
pnpm dlx expo run:android --device
```

First build is ~5 minutes (Gradle downloads). Subsequent builds are
30–60 seconds.

When it finishes the dev client opens on the phone and connects to
your local Metro server automatically.

### 4. Iterate

For JS-only changes: edit, save, the dev client hot-reloads.

For native config changes (permissions, plugins, bundle id, etc.):
rebuild with `pnpm dlx expo run:android --device`.

If Metro isn't running: `pnpm start --dev-client`.

---

## iOS — local build

### 1. Pair the device

- Plug iPhone into the Mac.
- On the phone, tap "Trust This Computer" and enter the passcode.
- In Xcode → Window → Devices and Simulators → confirm the phone shows
  up as a paired device (you may need to wait while symbols sync).
- On the phone, enable Developer Mode (Settings → Privacy & Security →
  Developer Mode → on). iOS prompts for a restart.

### 2. Generate native ios/ folder

```bash
cd omiGlass
pnpm dlx expo prebuild --platform ios --clean
```

### 3. Free-tier signing setup (only once)

You need an Apple ID added to Xcode (paid Developer Program not
required for personal dev installs; the app expires after 7 days):

- Xcode → Settings → Accounts → "+" → Apple ID, sign in.
- Open `omiGlass/ios/*.xcworkspace` in Xcode.
- Pick the app target → Signing & Capabilities → set Team to your
  personal team. Bundle id may need to be unique — change
  `com.basedhardware.find` to something like `com.<yourname>.omiglass`
  in `app.json` (then re-prebuild).

### 4. Build + install + launch

```bash
pnpm dlx expo run:ios --device
```

First build is ~5–10 minutes (Pod install + Xcode compile). The app
launches automatically.

### 5. After 7 days

Free-tier provisioning expires. Re-run `pnpm dlx expo run:ios --device`
to re-sign and reinstall. No code or config change needed.

---

## Verifying BLE on device

Once the app launches:

1. Tap **Connect to the device**. The OS prompts for Bluetooth
   permission (and on Android < 12, location permission). Allow both.
2. The app scans for `OMI Glass`. With the firmware powered on it
   should connect within a few seconds.
3. Photos start streaming into the grid (5-second cadence enforced by
   firmware).
4. The transcript panel stays empty on native (header says
   "— web only"). The Opus decoder is browser-only for now; native
   STT is a follow-up.

---

## Common gotchas

- **`adb: command not found`** — Add `$ANDROID_HOME/platform-tools` to
  `PATH`. See Prerequisites above.
- **`adb devices` shows `unauthorized`** — Re-plug the cable, then tap
  "Allow" on the RSA fingerprint prompt on the phone.
- **Scan timed out** — Phone Bluetooth off, firmware not powered on,
  or Android location permission denied. Toggle location services /
  re-grant the runtime permission.
- **Gradle build OOM** — Increase `org.gradle.jvmargs` in
  `omiGlass/android/gradle.properties` to `-Xmx4g`.
- **iOS build fails on signing** — Bundle id collision. Pick something
  unique (`com.<yourname>.omiglass`) in `app.json` → prebuild → retry.
- **iOS app installed but won't open** — Settings → General → VPN &
  Device Management → trust the developer profile.
- **Native config change (app.json) didn't take effect** — Any change
  under `ios`, `android`, `plugins`, or `scheme` requires re-running
  `expo prebuild --clean` and rebuilding. JS-only changes don't.

---

## When to fall back to EAS Build

Local builds are usually faster and free. Use EAS instead when:

- You need to give a teammate without the toolchain a build.
- You want a signed production / TestFlight build.
- You want to debug a build issue that only reproduces in CI.

The EAS free tier covers 30 builds / month. If you go that route,
the previous version of this guide explains the steps.

---

## Out of scope for this PR

- Auto-reconnect after disconnect (Web flow had this; native flow
  needs to re-scan, deferred to follow-up).
- Native STT pipeline (needs a native Opus decoder; tracked separately).
- Production release builds.
