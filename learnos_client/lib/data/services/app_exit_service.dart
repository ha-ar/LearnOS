import 'package:flutter/foundation.dart';
import 'package:window_manager/window_manager.dart';
import '../../../core/network/api_client.dart';

/// Handles the kiosk exit flow:
/// 1. Notifies the backend (creates a mentor escalation + logs the exit event).
/// 2. Closes the macOS window regardless of network outcome (learner is never trapped).
class AppExitService {
  /// Send exit notification then close the app.
  static Future<void> exitAndNotify({
    required String sessionId,
    String reason = 'Learner requested exit',
    int elapsedSeconds = 0,
    int tasksCompleted = 0,
    int tasksTotal = 0,
  }) async {
    // Fire notification — best-effort, never blocks the exit
    try {
      if (sessionId.isNotEmpty) {
        await ApiClient.asyncPost(
          '/sessions/$sessionId/exit-app',
          {
            'reason': reason,
            'elapsed_seconds': elapsedSeconds,
            'tasks_completed': tasksCompleted,
            'tasks_total': tasksTotal,
          },
          requireAuth: true,
        );
      }
    } catch (e) {
      debugPrint('[AppExitService] Exit notification failed (proceeding anyway): $e');
    }

    // Disable prevent-close then close cleanly (desktop only; window_manager
    // has no web implementation).
    if (!kIsWeb) {
      await windowManager.setPreventClose(false);
      await windowManager.close();
    }
  }
}
