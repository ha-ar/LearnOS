# Running the LearnOS Native Client on macOS

The LearnOS client is a Flutter desktop app targeting **macOS** (kiosk-style
fullscreen learner workspace). Building and running the native macOS app
requires **macOS + Xcode** — it cannot be built on Linux or Windows.

The same `lib/` code also compiles to Flutter **web** (see the bottom of this
doc), which is useful for quick previews on any platform.

---

## 1. One-time prerequisites (on your Mac)

```bash
# Xcode — install from the App Store, then:
xcode-select --install
sudo xcodebuild -license accept

# CocoaPods — required for macOS Flutter plugins (window_manager, etc.)
sudo gem install cocoapods        # or: brew install cocoapods

# Flutter SDK
brew install --cask flutter       # or download from https://flutter.dev
flutter config --enable-macos-desktop
flutter doctor                     # resolve any ❌ before continuing
```

`flutter doctor` should show a green check for **Xcode** and for
**Connected device → macOS (desktop)**.

## 2. Get the code

```bash
git clone https://github.com/ha-ar/LearnOS.git
cd LearnOS/learnos_client
flutter pub get
```

## 3. Run the native macOS app

There are two ways to point the app at a backend.

### Option A — deployed backend (fastest, nothing else to run)

`lib/core/network/api_client.dart` defaults `API_BASE_URL` to the hosted
Cloud Run backend, so you can just run:

```bash
flutter run -d macos
```

### Option B — local backend

Run the backend + Postgres from the repo root (needs Docker Desktop, or a
local Postgres 15/16):

```bash
cd ../                                   # repo root
docker compose -f docker-compose.dev.yml up -d postgres
cd backend
npm install
npm run migrate
npm run seed
npm run dev                              # API on http://localhost:4000
```

Then, in another terminal, run the client against it:

```bash
cd learnos_client
flutter run -d macos --dart-define=API_BASE_URL=http://localhost:4000/api
```

### Pilot logins (password: `LearnOS2026!`)

| Role    | Email                 |
|---------|-----------------------|
| Learner | `ahmed@pilot.learnos` |
| Learner | `sara@pilot.learnos`  |
| Learner | `omar@pilot.learnos`  |
| Mentor  | `mentor@pilot.learnos`|
| Parent  | `parent@pilot.learnos`|
| Admin   | `admin@pilot.learnos` |

## 4. Build a standalone .app

```bash
flutter build macos
# Output: build/macos/Build/Products/Release/learnos_client.app
```

---

## Notes

- The macOS sandbox entitlement `com.apple.security.network.client` is already
  enabled in `macos/Runner/DebugProfile.entitlements` and `Release.entitlements`,
  so the app is permitted to reach the backend over the network.
- `window_manager` (fullscreen kiosk, prevent-close) is desktop-only. It is
  guarded behind `!kIsWeb` in `lib/main.dart` and
  `lib/data/services/app_exit_service.dart`, so the same code also runs on web.

## Optional: run as Flutter web (any OS, for a quick preview)

```bash
# CanvasKit is served from the local bundle with --no-web-resources-cdn
flutter build web --no-web-resources-cdn --dart-define=API_BASE_URL=http://localhost:4000/api
cd build/web && python3 -m http.server 3003
# open http://localhost:3003
```

This is a browser preview of the same UI — it is **not** the macOS kiosk
experience (fullscreen enforcement and exit-to-mentor flow are desktop-only).
