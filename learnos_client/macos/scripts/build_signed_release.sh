#!/usr/bin/env bash
# Build, sign, notarize, and package the macOS release build for distribution
# to other Macs. Run this from the learnos_client/ directory (or anywhere,
# it cd's itself).
#
# ONE-TIME SETUP before running this:
#   1. Xcode > Settings > Accounts > add the Apple ID that's on the Apple
#      Developer Program (the account, not just any Apple ID).
#   2. Open macos/Runner.xcworkspace in Xcode, select the Runner target >
#      Signing & Capabilities > set Team to your org's team. Do this once
#      for Debug and Release. Automatic signing is fine — Xcode will
#      provision a "Developer ID Application" certificate for you the
#      first time you archive.
#   3. Get your Team ID: Xcode > Settings > Accounts > your account >
#      membership details. Or: run `security find-identity -v -p codesigning`
#      after step 2 and read the (XXXXXXXXXX) after "Developer ID Application:".
#   4. Create an app-specific password at appleid.apple.com (Sign-In and
#      Security > App-Specific Passwords) — notarization can't use your
#      normal Apple ID password. Then store it once in the keychain so you
#      never have to paste it again:
#        xcrun notarytool store-credentials "notarytool-profile" \
#          --apple-id "you@example.com" --team-id "TEAMID" --password "app-specific-pw"
#
# Fill these in (or export them before running):
TEAM_ID="${TEAM_ID:-REPLACE_WITH_TEAM_ID}"
SIGNING_IDENTITY="${SIGNING_IDENTITY:-Developer ID Application: YOUR NAME (${TEAM_ID})}"
NOTARY_PROFILE="${NOTARY_PROFILE:-notarytool-profile}"   # matches store-credentials name above

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MACOS_DIR="$(dirname "$SCRIPT_DIR")"          # .../learnos_client/macos
PROJECT_DIR="$(dirname "$MACOS_DIR")"          # .../learnos_client
cd "$PROJECT_DIR"

APP_NAME="learnos_client"
BUILD_DIR="build/macos/Build/Products/Release"
APP_PATH="$BUILD_DIR/${APP_NAME}.app"
ENTITLEMENTS="macos/Runner/Release.entitlements"
ZIP_PATH="build/macos/${APP_NAME}.zip"
DMG_PATH="build/macos/${APP_NAME}.dmg"

echo "== flutter pub get =="
flutter pub get

echo "== flutter build macos --release =="
flutter build macos --release

if [ ! -d "$APP_PATH" ]; then
  echo "Build output not found at $APP_PATH" >&2
  exit 1
fi

echo "== codesign (Developer ID, hardened runtime) =="
codesign --deep --force --verify --verbose \
  --sign "$SIGNING_IDENTITY" \
  --options runtime \
  --entitlements "$ENTITLEMENTS" \
  --timestamp \
  "$APP_PATH"

echo "== verify signature =="
codesign --verify --deep --strict --verbose=2 "$APP_PATH"
spctl --assess --type execute --verbose "$APP_PATH" || echo "spctl will fail until notarized+stapled — that's expected at this point."

echo "== zip for notarization =="
rm -f "$ZIP_PATH"
ditto -c -k --keepParent "$APP_PATH" "$ZIP_PATH"

echo "== submit for notarization (this can take a few minutes) =="
xcrun notarytool submit "$ZIP_PATH" --keychain-profile "$NOTARY_PROFILE" --wait

echo "== staple the ticket =="
xcrun stapler staple "$APP_PATH"

echo "== re-verify after stapling =="
spctl --assess --type execute --verbose "$APP_PATH"

echo "== build a DMG for distribution =="
rm -f "$DMG_PATH"
hdiutil create -volname "$APP_NAME" -srcfolder "$APP_PATH" -ov -format UDZO "$DMG_PATH"

echo
echo "Done. Distributable, notarized DMG at: $PROJECT_DIR/$DMG_PATH"
echo "This will open cleanly on any Mac without Gatekeeper warnings."
