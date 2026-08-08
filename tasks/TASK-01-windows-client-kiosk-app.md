# TASK-01: Cross-Platform Learning Client — macOS, Windows & iOS (Kiosk/Managed Mode)

## Overview
Build the **LearnOS Learning Client** — a full-screen, distraction-resistant learning workspace that runs on **macOS** (Phase 1 MVP), **Windows** (Phase 2), and **iOS/iPadOS** (Phase 2–3). The client must support institutional kiosk/managed-device mode on each platform. **Flutter is the recommended framework** because it targets all three platforms from a single Dart codebase.

## Context (from LearnOS Product Document)
> "The centre deployment uses a managed-device kiosk mode so the learner cannot casually leave the approved session."

**Platform Priority:**
- **Phase 1 MVP:** macOS — Flutter app + Apple Configurator 2 / Jamf School for kiosk
- **Phase 2:** Windows — same Flutter codebase, Windows Assigned Access for kiosk
- **Phase 2–3:** iOS/iPadOS — same Flutter codebase, MDM Single App Mode

---

## Recommended Framework: Flutter

### Why Flutter for LearnOS

| Criteria | Flutter | Electron | Tauri |
|----------|---------|---------|-------|
| **Windows support** | ✅ Native | ✅ Mature | ✅ Mature |
| **macOS support** | ✅ Native | ✅ Mature | ✅ Mature |
| **iOS support** | ✅ Mature | ❌ No | ⚠️ Beta (Tauri 2.x) |
| **Single codebase** | ✅ One Dart codebase | ❌ Desktop only | ⚠️ Partial |
| **Bundle size** | ~30–80 MB | 100 MB+ | 5–15 MB |
| **Performance** | 60fps native canvas | High but RAM-heavy | High, lightweight |
| **Language** | Dart | JS/TS | JS/TS + Rust |
| **Kiosk window control** | ✅ `window_manager` package | ✅ Built-in | ✅ Built-in |
| **Consistent UI across OS** | ✅ Pixel-perfect | ⚠️ WebView differences | ⚠️ System WebView differences |

**Decision: Use Flutter.** Single Dart codebase covers Windows, macOS, and iOS. The UI will be consistent and pixel-perfect across all platforms. The `window_manager` package handles desktop kiosk windowing, and iOS kiosk is handled at the OS/MDM level (not in-app).

### Flutter Packages Required

```yaml
# pubspec.yaml
dependencies:
  flutter:
    sdk: flutter

  # Window management (desktop kiosk)
  window_manager: ^0.3.8          # Full-screen, frameless, always-on-top, intercept close
  launch_at_startup: ^0.3.1       # Auto-launch on Windows/macOS boot

  # State management
  flutter_riverpod: ^2.5.0        # Or bloc/provider — team choice

  # Navigation
  go_router: ^14.0.0

  # HTTP & API
  dio: ^5.4.0
  retrofit: ^4.1.0                # Type-safe API client generation

  # Secure storage (tokens, device tokens)
  flutter_secure_storage: ^9.0.0

  # WebView (for embedded resources — Khan Academy deep links)
  webview_flutter: ^4.7.0         # Works on iOS; use webview_flutter_windows on Windows

  # Local storage / offline cache
  hive_flutter: ^1.1.0            # Fast, lightweight local DB

  # Auth
  jwt_decoder: ^2.0.1

  # Utilities
  intl: ^0.19.0
  logger: ^2.3.0
  uuid: ^4.3.3
```

---

## Platform-by-Platform Kiosk Implementation

### 🪟 Windows — Kiosk Mode

**OS-level mechanism: Windows Assigned Access (Kiosk Mode)**

| Approach | Reliability | Setup Effort | Best For |
|----------|------------|-------------|---------|
| **Windows Assigned Access (Single App)** | ⭐⭐⭐⭐⭐ | Medium | Centre-managed devices |
| **Windows Shell Launcher** | ⭐⭐⭐⭐⭐ | High | Enterprise/advanced |
| **`window_manager` fullscreen + keyboard hooks** | ⭐⭐⭐ | Low | Development / light kiosk |

**Recommended for LearnOS MVP: Windows Assigned Access**

Setup steps (done by admin at device deployment, not in app code):
1. Create a local Windows user account `learnos-learner` (standard user, no admin rights)
2. Configure Assigned Access via Settings → Accounts → Family & Other Users → Set Up a Kiosk
3. Point to the LearnOS Flutter app executable
4. The Windows Shell is replaced by the app — no Start menu, no taskbar, no task switcher

**In-app Flutter code (adds defence-in-depth):**
```dart
// lib/platform/windows_kiosk.dart
import 'package:window_manager/window_manager.dart';

Future<void> initWindowsKiosk() async {
  await windowManager.ensureInitialized();
  await windowManager.setFullScreen(true);
  await windowManager.setAlwaysOnTop(true);
  await windowManager.setPreventClose(true);   // Intercept Alt+F4
  await windowManager.setTitleBarStyle(TitleBarStyle.hidden);
  await windowManager.setSkipTaskbar(true);
}
```

**Keyboard shortcut suppression (Windows-specific):**
Use a low-level keyboard hook via a Dart FFI plugin or a minimal Win32 helper to suppress:
- `Alt+Tab`, `Alt+F4`, `Ctrl+Alt+Del` (Ctrl+Alt+Del cannot be blocked by user-mode code — OS handles it via Assigned Access)
- `Windows key` (suppressed automatically in Assigned Access)

---

### 🍎 macOS — Kiosk Mode

macOS kiosk is **more complex** than Windows because macOS is a full desktop OS. There are two approaches:

#### Option A: MDM + Autonomous Single App Mode (ASAM) — **Recommended for Centre Deployment**

**Requirements:**
- Devices enrolled in **Apple School Manager (ASM)** or **Apple Business Manager (ABM)**
- MDM solution: **Jamf School** (education-focused, recommended), **Jamf Pro**, or **Microsoft Intune**
- Devices must be **Supervised** (achieved via ADE — Automated Device Enrollment)

**How it works:**
1. Enrol all centre Macs in Apple School Manager
2. In Jamf (or Intune), create a **Configuration Profile**:
   - Enable Autonomous Single App Mode (ASAM) for the LearnOS app (by Bundle ID)
   - Restrict Dock access
   - Disable Finder, menu bar customisation
   - Prevent System Settings access
   - Disable Force Quit shortcut
3. Deploy profile remotely to all devices
4. LearnOS app calls `UIAccessibilityRequestGuidedAccessSession(true)` equivalent for macOS (the ASAM API) to lock into itself

**MDM Options Comparison:**

| MDM | Cost | Best For |
|-----|------|---------|
| **Jamf School** | Paid (education pricing) | Best for schools/learning centres; purpose-built |
| **Jamf Pro** | Enterprise pricing | Large orgs with IT team |
| **Microsoft Intune** | Included in M365 | If org already uses Microsoft 365 |
| **Apple Configurator 2** | Free | Manual device supervision (small scale) |
| **Mosyle** | Paid | Mac/iPad education MDM, good pricing |

**Recommendation for LearnOS:** Start with **Apple Configurator 2** (free, works for 1–10 devices in a pilot) → scale to **Jamf School** when expanding.

#### Option B: Application-Level Kiosk (No MDM) — Development/Fallback

For development or when devices aren't enrolled in ASM yet, Flutter `window_manager` provides a good approximation:

```dart
// lib/platform/macos_kiosk.dart
import 'package:window_manager/window_manager.dart';

Future<void> initMacOSKiosk() async {
  await windowManager.ensureInitialized();
  await windowManager.setFullScreen(true);        // Covers menu bar
  await windowManager.setAlwaysOnTop(true);
  await windowManager.setPreventClose(true);
  await windowManager.setTitleBarStyle(TitleBarStyle.hidden);

  // macOS: request to hide Dock
  // Use platform channel to call NSApplication.setPresentationOptions
}
```

**macOS platform channel for hiding Dock/Menu Bar:**
```swift
// macos/Runner/AppDelegate.swift
import Cocoa

class AppDelegate: FlutterAppDelegate {
  override func applicationDidFinishLaunching(_ notification: Notification) {
    NSApp.presentationOptions = [
      .hideDock,
      .hideMenuBar,
      .disableProcessSwitching,  // Disables Cmd+Tab
      .disableHideApplication,
      .disableForceQuit          // Disables Cmd+Option+Escape
    ]
  }
}
```

> **Warning:** `NSApp.presentationOptions` can be overridden by user in non-supervised mode. For true kiosk on macOS, MDM + ASAM is required.

---

### 📱 iOS / iPadOS — Kiosk Mode

iOS has the **strongest** native kiosk support of all three platforms.

#### Option A: MDM Single App Mode — **Recommended for Production**

The gold standard. Requires:
- Devices enrolled in **Apple School Manager (ASM)**
- **Supervised** devices (supervision survives device wipe)
- An MDM solution

**How it works:**
1. Devices enrolled in ASM are automatically Supervised
2. MDM sends a "Single App Mode" configuration profile specifying LearnOS's Bundle ID
3. iOS locks to LearnOS — Home button/swipe up is disabled, Control Center is hidden, app switching is blocked
4. If device restarts, it automatically relaunches LearnOS
5. Admin can remotely release from Single App Mode via MDM

**Recommended MDM options for iOS/iPadOS:**

| MDM | iOS Support | Cost | Notes |
|-----|------------|------|-------|
| **Jamf School** | ✅ Excellent | Education pricing | Best for schools; includes Apple Volume Purchase |
| **ManageEngine MDM** | ✅ Good | Free up to 25 devices | Good for small pilots |
| **Mosyle Manager** | ✅ Excellent | Free up to 30 devices | Apple education specialist |
| **SimpleMDM** | ✅ Good | Per-device pricing | Simple setup |
| **Apple Configurator 2** | ✅ Manual | Free | For small pilots without ASM |

**For MVP Pilot (30–100 learners):** Use **Mosyle Manager** (free tier covers up to 30 devices) or **Apple Configurator 2** for device-by-device setup.

#### Option B: Guided Access — **Development / Demo Only**

Built into every iPhone/iPad. No MDM required.

- Triple-click Home button (or Side button on Face ID devices)
- Enter passcode → enable Guided Access
- Locks device to current app
- **Limitations:** Not persistent across reboots, must be enabled per device manually, passcode can be guessed

**Use case for LearnOS:** Guided Access is only suitable for demos and prototypes. Use MDM Single App Mode for the actual centre deployment.

#### Option C: `kiosk_mode` Flutter Package (App-Level iOS Lock)

The [`kiosk_mode`](https://pub.dev/packages/kiosk_mode) package allows the app to programmatically **request** Guided Access via `UIAccessibilityRequestGuidedAccessSession`:

```dart
// lib/platform/ios_kiosk.dart
import 'package:kiosk_mode/kiosk_mode.dart';

Future<void> initIOSKiosk() async {
  // Programmatically start Guided Access (requires device to have GA configured)
  await KioskMode.startKioskMode();
}
```

> **Limitation:** `UIAccessibilityRequestGuidedAccessSession` still requires the device to have Guided Access enabled. It's a convenience wrapper — not a bypass. For true kiosk on iOS, you still need MDM.

---

## Flutter Project Structure

```
learnos_client/
├── lib/
│   ├── main.dart                   # Entry point, platform detection
│   ├── app.dart                    # App widget, router setup
│   ├── platform/
│   │   ├── kiosk_service.dart      # Abstract kiosk interface
│   │   ├── windows_kiosk.dart      # Windows-specific kiosk init
│   │   ├── macos_kiosk.dart        # macOS-specific kiosk init
│   │   └── ios_kiosk.dart          # iOS-specific kiosk init (Guided Access / MDM)
│   ├── features/
│   │   ├── auth/                   # Login screens
│   │   ├── session/                # Session plan + task runner
│   │   ├── workspace/              # Main learning workspace
│   │   ├── ai_companion/           # AI Companion panel
│   │   ├── tools/                  # Notes, whiteboard, calculator
│   │   ├── progress/               # Progress strip + next action
│   │   └── reflection/             # End-of-session reflection
│   ├── data/
│   │   ├── api/                    # Dio HTTP client + endpoints
│   │   ├── mock/                   # Mock data for development
│   │   └── local/                  # Hive local cache
│   ├── core/
│   │   ├── auth/                   # JWT handling, secure storage
│   │   ├── events/                 # Telemetry event emitter
│   │   └── theme/                  # App theme (dark/light)
│   └── shared/
│       └── widgets/                # Shared UI components
├── windows/                        # Windows-specific Flutter files
├── macos/                          # macOS-specific Flutter files
│   └── Runner/AppDelegate.swift    # Presentation options for kiosk
├── ios/                            # iOS-specific Flutter files
├── pubspec.yaml
└── README.md
```

---

## Platform Kiosk Comparison Summary

| Feature | Windows | macOS | iOS/iPadOS |
|---------|---------|-------|-----------|
| **Native kiosk mechanism** | Assigned Access | ASAM via MDM | Single App Mode via MDM |
| **MDM required?** | No (built-in) | Yes (for true kiosk) | Yes (for true kiosk) |
| **Survives reboot?** | ✅ Yes (Assigned Access) | ✅ Yes (with MDM) | ✅ Yes (MDM) |
| **App-level fallback** | `window_manager` + keyboard hooks | `window_manager` + `NSApp.presentationOptions` | `kiosk_mode` package (Guided Access) |
| **Free MDM option** | N/A | Apple Configurator 2 | Mosyle (free ≤30) / Configurator 2 |
| **Recommended MDM** | Windows Assigned Access (built-in) | Jamf School / Mosyle | Jamf School / Mosyle |
| **Pilot complexity** | 🟢 Low | 🟡 Medium | 🟡 Medium |

---

## MVP Delivery Plan

### ✅ Phase 1 — macOS (Centre MVP — Ship First)
- Build Flutter app targeting **macOS**
- Add `AppDelegate.swift` with `NSApp.presentationOptions` for kiosk mode
- For pilot: use **Apple Configurator 2** (free) to supervise Macs and push ASAM profile
- For scale: use **Jamf School** or **Mosyle** MDM
- Mock data for all backend features
- **Target hardware:** Any centre Mac running macOS 12 Monterey or later

### Phase 2 — Windows
- Same Flutter codebase compiles to Windows with **zero UI changes**
- Add `windows_kiosk.dart` with `window_manager` + keyboard hook
- Deploy via **Windows Assigned Access** (built-in, no extra software)
- No MDM required for Windows kiosk

### Phase 2–3 — iOS/iPadOS
- Same Flutter codebase compiles to iOS with **zero UI changes**
- Enrol iPads in **Apple School Manager** → supervised
- Push **Single App Mode** profile via MDM (Mosyle free ≤30 devices)
- Home bar/swipe gestures fully blocked at OS level

---

## Mock Data (MVP Phase)

Use hardcoded/mock data for all backend-dependent features:

```dart
// lib/data/mock/session_mock.dart
const mockSession = {
  "learner": {
    "id": "mock-learner-001",
    "name": "Ahmed Khan",
    "grade": "Grade 6",
    "curriculum": "Pakistan National Curriculum"
  },
  "today_plan": {
    "session_goal": "Review fractions; learn equivalent fractions; practise; reflect.",
    "tasks": [
      { "id": "t1", "type": "review", "topic": "Basic Fractions", "duration_min": 10, "status": "completed" },
      { "id": "t2", "type": "learn", "topic": "Equivalent Fractions", "resource_id": "khan-eq-fractions", "duration_min": 15, "status": "active" },
      { "id": "t3", "type": "practice", "topic": "Equivalent Fractions Quiz", "resource_id": "internal-quiz-001", "duration_min": 10, "status": "pending" },
      { "id": "t4", "type": "reflect", "topic": "Session Reflection", "duration_min": 5, "status": "pending" }
    ]
  }
};
```

Enable with environment flag:
```dart
// lib/core/config.dart
const bool useMockData = bool.fromEnvironment('USE_MOCK', defaultValue: true);
```

---

## Acceptance Criteria

### Phase 1 — macOS (MVP ✅ Ship These First)
- [ ] Flutter app compiles and launches full-screen on macOS 12+
- [ ] Dock and menu bar are hidden via `NSApp.presentationOptions`
- [ ] Cmd+Tab app switching is disabled
- [ ] `window_manager` prevents window close button and Cmd+W
- [ ] Apple Configurator 2 profile applies ASAM and app auto-launches on login
- [ ] Login flow authenticates and loads a session plan (mock data)
- [ ] All 6 workspace areas render correctly at 1920×1080 and 1440×900 (common Mac resolutions)
- [ ] Admin exit gesture (5-tap on logo + PIN) exits kiosk mode
- [ ] Session events emitted to console (mock) in correct JSON format
- [ ] Mock data renders all 4 session task types: review, learn, practice, reflect

### Phase 2 — Windows
- [ ] Same Flutter codebase compiles and runs full-screen on Windows 10/11
- [ ] `window_manager` prevents Alt+F4 / title bar close
- [ ] App works within Windows Assigned Access restricted user account
- [ ] All 6 workspace areas render at 1920×1080 and 1366×768

### Phase 2–3 — iOS/iPadOS
- [ ] Flutter app compiles and runs on iPad (primary) and iPhone
- [ ] `kiosk_mode` package starts Guided Access in dev/demo mode
- [ ] Single App Mode MDM profile tested in staging — Home bar blocked
- [ ] UI adapts correctly to iPad screen ratio (landscape preferred)

---

## Dependencies
- **TASK-02**: Learning Workspace UI (renders inside this client)
- **TASK-03**: Authentication & Identity Service
- **TASK-05**: Session Plan & Core Services API
- **TASK-07**: Event Log (telemetry emission)
- **TASK-08**: AI Companion (panel integration)

---

## Notes for LLM Agent
- Flutter is the single codebase — do not create separate projects for Windows/macOS/iOS
- Use `Platform.isWindows`, `Platform.isMacOS`, `Platform.isIOS` to conditionally call platform kiosk code
- `window_manager` is desktop-only — guard with `if (!Platform.isIOS)` before calling
- `kiosk_mode` is mobile-only — guard with `if (Platform.isIOS || Platform.isAndroid)`
- The WebView for Khan Academy links: use `webview_flutter` (cross-platform) — it works on iOS and Android; for Windows/macOS use `webview_windows` or `webview_flutter_windows`
- All kiosk setup code runs in `main()` before `runApp()` on desktop
- For iOS kiosk in production: the MDM profile does the heavy lifting — the app itself just needs to be a well-behaved, full-screen Flutter app
- Test on actual physical Windows hardware for Assigned Access — it behaves differently in VM
