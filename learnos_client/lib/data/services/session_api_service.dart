import '../../../core/network/api_client.dart';

class SessionApiService {
  /// Generate or fetch today's session plan for a learner via POST /api/sessions/generate-plan/:learner_id
  static Future<Map<String, dynamic>> generatePlan(String learnerId) async {
    try {
      final res = await ApiClient.asyncPost(
        '/sessions/generate-plan/$learnerId',
        {},
        requireAuth: true,
      );
      return res['plan'] ?? res;
    } catch (e) {
      // Fallback: fetch session by ID if already created
      rethrow;
    }
  }

  /// Get session details with ordered tasks via GET /api/sessions/:id
  static Future<Map<String, dynamic>> getSession(String sessionId) async {
    final res = await ApiClient.asyncGet('/sessions/$sessionId', requireAuth: true);
    return res;
  }

  /// Start a session via POST /api/sessions/:id/start
  static Future<Map<String, dynamic>> startSession(String sessionId) async {
    final res = await ApiClient.asyncPost(
      '/sessions/$sessionId/start',
      {},
      requireAuth: true,
    );
    return res['session'] ?? res;
  }

  /// Update task status via PATCH /api/sessions/tasks/:task_id/status
  static Future<Map<String, dynamic>> updateTaskStatus(
    String taskId,
    String status, // 'active' | 'completed' | 'skipped'
  ) async {
    final res = await ApiClient.asyncPatch(
      '/sessions/tasks/$taskId/status',
      {'status': status},
      requireAuth: true,
    );
    return res['task'] ?? res;
  }

  /// End session via POST /api/sessions/:id/end
  static Future<Map<String, dynamic>> endSession(String sessionId) async {
    final res = await ApiClient.asyncPost(
      '/sessions/$sessionId/end',
      {},
      requireAuth: true,
    );
    return res['session'] ?? res;
  }
}
