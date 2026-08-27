import 'package:flutter/foundation.dart';
import '../../../core/network/api_client.dart';

class TwinApiService {
  /// Fetch digital twin summary for a learner via GET /api/twin/:learner_id
  static Future<Map<String, dynamic>> getTwinSummary(String learnerId) async {
    try {
      final res = await ApiClient.asyncGet('/twin/$learnerId', requireAuth: true);
      return res['twin'] ?? res;
    } catch (e) {
      debugPrint('Twin summary fetch error: $e');
      return {};
    }
  }

  /// Fetch competency states for a learner via GET /api/twin/:learner_id/competencies
  static Future<List<dynamic>> getCompetencies(String learnerId) async {
    try {
      final res = await ApiClient.asyncGet('/twin/$learnerId/competencies', requireAuth: true);
      return res['competencies'] ?? [];
    } catch (e) {
      return [];
    }
  }

  /// Fetch real curriculum course progress via GET /api/twin/:learner_id/course-progress
  static Future<Map<String, dynamic>> getCourseProgress(String learnerId) async {
    try {
      final res = await ApiClient.asyncGet('/twin/$learnerId/course-progress', requireAuth: true);
      return res['progress'] ?? res;
    } catch (e) {
      debugPrint('Course progress fetch error: $e');
      return {};
    }
  }
}

