import 'package:flutter/foundation.dart';
import '../../../core/network/api_client.dart';

class EventApiService {
  /// Ingest session telemetry event via POST /api/events
  static Future<void> logEvent({
    required String eventType,
    required String sessionId,
    required String learnerId,
    required String tenantId,
    String? taskId,
    String? resourceId,
    String? competencyId,
    String? deviceId,
    Map<String, dynamic>? payload,
  }) async {
    try {
      await ApiClient.asyncPost(
        '/events',
        {
          'event_type': eventType,
          'session_id': sessionId,
          'learner_id': learnerId,
          'tenant_id': tenantId,
          if (taskId != null) 'task_id': taskId,
          if (resourceId != null) 'resource_id': resourceId,
          if (competencyId != null) 'competency_id': competencyId,
          if (deviceId != null) 'device_id': deviceId,
          'payload': payload ?? {},
          'timestamp': DateTime.now().toIso8601String(),
        },
        requireAuth: true,
      );
    } catch (e) {
      debugPrint('Telemetry log warning: $e');
    }
  }
}
