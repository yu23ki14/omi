# omiGlass — Native Dev Build Guide

Web (`pnpm web`) keeps working with Web Bluetooth; this guide is for
running the **native iOS / Android dev build** so `react-native-ble-plx`
can drive BLE on a real phone.

Expo Go cannot host this app any more (BLE is a native module), so you
need either:

1. **EAS Build (cloud)** — recommended for the first build. No local
   Android SDK / Xcode setup needed.
2. **Local prebuild** — requires Android Studio + SDK or Xcode.

---

## Prerequisites

- An Expo account (free): https://expo.dev/signup
- `EXPO_PUBLIC_GROQ_API_KEY` set in `.env` (re-used for vision + STT)
- A real phone with USB cable
  - **Android**: Developer Options + USB Debugging enabled
  - **iOS**: Apple ID; for personal team certificates the app expires
    every 7 days (free tier); for production cert you need an Apple
    Developer Program membership ($99/yr)

---

## Option 1 — EAS Build (cloud, recommended first time)

### 1. Install EAS CLI and log in

```bash
pnpm add -g eas-cli
eas login
```

### 2. Create `eas.json` if it doesn't exist

```bash
eas build:configure
```

When prompted, confirm "yes" to create the default profiles. The
generated `eas.json` should include a `development` profile with
`"developmentClient": true` and `"distribution": "internal"`.

### 3. Android — build APK and install

```bash
eas build --profile development --platform android
```

- 15–25 minutes in the queue on the free tier.
- When finished EAS prints a URL — open it on the phone, download the
  APK, and install (you may need to allow "install from unknown sources").

Alternative install path via ADB:
```bash
adb install path/to/downloaded.apk
```

### 4. iOS — register device, then build IPA

iOS requires registering each test device before building:

```bash
eas device:create
```

Follow the QR code prompt on the phone to register the UDID.

Then:
```bash
eas build --profile development --platform ios
```

When done, install via the URL EAS prints (Safari handles the
installation profile).

### 5. Start the dev server and connect

```bash
pnpm start --dev-client
```

Open the installed app on the phone. The dev launcher will list local
dev servers; tap the running one. (If it doesn't auto-discover, scan
the QR code printed in the terminal.)

---

## Option 2 — Local prebuild

Only do this if you already have a working native toolchain.

### Android

Requirements: Android Studio + SDK + Java 17 + an emulator or a USB
phone with debugging on.

```bash
pnpm dlx expo prebuild --platform android
pnpm dlx expo run:android
```

This compiles the APK locally and pushes it to the connected device.

### iOS

Requirements: macOS + Xcode 26 + a free or paid Apple Developer account.

```bash
pnpm dlx expo prebuild --platform ios
pnpm dlx expo run:ios --device
```

---

## Verifying BLE on device

Once the app launches:

1. Tap **Connect to the device** — the OS asks for Bluetooth permission
   the first time. On Android the location prompt also fires (required
   below API 31).
2. The app scans for `OMI Glass`. With the firmware running it should
   connect within a few seconds.
3. Photos should start streaming into the grid (5-second cadence is
   enforced by the firmware).
4. The **transcript panel** stays empty on native ("web only" suffix is
   shown in its header). That's expected — the Opus decoder is
   browser-only for now; native STT is a follow-up.

---

## Common gotchas

- **`Scan timed out: OMI Glass not found`** — usually means the phone's
  Bluetooth is off, or the device isn't powered on, or Android location
  permission was denied.
- **iOS shows nothing in dev launcher** — make sure both the phone and
  the laptop are on the same Wi-Fi; LAN discovery is required.
- **APK install blocked** — Android's "install from unknown sources"
  permission needs to be granted per-source (Chrome / Files / etc.).
- **`adb: command not found`** — `adb` ships with the Android platform
  tools. Install via `brew install --cask android-platform-tools` on
  macOS.
- **Need to rebuild after `app.json` permission changes** — Yes. Any
  change to native config (permissions, plugins, bundle id) requires a
  new dev build; JS-only changes are picked up by the dev server.

---

## Out of scope

- Auto-reconnect after disconnect (Web flow had this; native flow needs
  to re-scan, deferred to follow-up).
- Native STT pipeline (needs a native Opus decoder; tracked separately).
- Production release builds — this guide only covers internal-distribution
  dev clients.
