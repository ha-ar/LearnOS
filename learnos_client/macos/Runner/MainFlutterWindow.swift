import Cocoa
import FlutterMacOS

class MainFlutterWindow: NSWindow {
  override func awakeFromNib() {
    let flutterViewController = FlutterViewController()
    let windowFrame = self.frame
    self.contentViewController = flutterViewController
    self.setFrame(windowFrame, display: true)

    RegisterGeneratedPlugins(registry: flutterViewController)

    // Hide traffic light buttons (close / minimise / fullscreen green dot)
    self.standardWindowButton(.closeButton)?.isHidden = true
    self.standardWindowButton(.miniaturizeButton)?.isHidden = true
    self.standardWindowButton(.zoomButton)?.isHidden = true

    // Allow content to extend under the title bar area
    self.styleMask.insert(.fullSizeContentView)

    // Prevent window from being moved or manually resized
    self.isMovable = false

    // Enter fullscreen at the native layer immediately.
    // We use a short dispatch_after so the window is fully on-screen
    // before the fullscreen animation begins (avoids a blank-frame flicker).
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
      guard let self = self else { return }
      if !self.styleMask.contains(.fullScreen) {
        self.toggleFullScreen(nil)
      }
    }

    super.awakeFromNib()
  }
}


