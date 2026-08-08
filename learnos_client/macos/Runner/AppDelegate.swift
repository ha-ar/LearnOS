import Cocoa
import FlutterMacOS

@main
class AppDelegate: FlutterAppDelegate {
  override func applicationDidFinishLaunching(_ aNotification: Notification) {
    super.applicationDidFinishLaunching(aNotification)
    // Activate kiosk mode immediately: hide Dock, menu bar, and block app switching
    enableKioskPresentationOptions()
  }

  override func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
    return false  // Don't terminate on window close — Flutter handles exit via our custom button
  }

  /// Locks the macOS UI into kiosk/single-app mode.
  /// Hides the Dock and menu bar, disables Cmd+Tab, and disables Cmd+Option+Esc.
  func enableKioskPresentationOptions() {
    NSApp.presentationOptions = [
      .hideDock,
      .hideMenuBar,
      .disableProcessSwitching,   // Blocks Cmd+Tab app switching
      .disableHideApplication,    // Prevents ⌘H hide
      .disableForceQuit           // Blocks Cmd+Option+Esc
    ]
  }
}

