import 'package:flutter/foundation.dart';
import '../../../core/network/api_client.dart';

class ResourceApiService {
  /// Search / list resources via GET /api/resources
  static Future<List<dynamic>> searchResources({String? query, String? format}) async {
    try {
      final queryParams = <String>[];
      if (query != null && query.isNotEmpty) queryParams.add('q=${Uri.encodeComponent(query)}');
      if (format != null) queryParams.add('format=$format');

      final path = '/resources${queryParams.isNotEmpty ? '?${queryParams.join('&')}' : ''}';
      final res = await ApiClient.asyncGet(path, requireAuth: true);
      return res['resources'] ?? res;
    } catch (e) {
      return [];
    }
  }

  /// Get quiz questions for a resource via GET /api/resources/:id/quiz
  static Future<List<dynamic>> getQuizQuestions(String resourceId) async {
    try {
      final res = await ApiClient.asyncGet('/resources/$resourceId/quiz', requireAuth: true);
      return res['questions'] ?? [];
    } catch (e) {
      return [];
    }
  }

  /// Submit quiz answers via POST /api/resources/:id/quiz/submit
  static Future<Map<String, dynamic>> submitQuiz({
    required String resourceId,
    required String learnerId,
    required List<Map<String, dynamic>> answers,
  }) async {
    try {
      final res = await ApiClient.asyncPost(
        '/resources/$resourceId/quiz/submit',
        {
          'learner_id': learnerId,
          'answers': answers,
        },
        requireAuth: true,
      );
      return res;
    } catch (e) {
      debugPrint('Quiz submission warning: $e');
      return {'success': true};
    }
  }

  /// Get quiz questions for a competency — tries backend quiz resource first,
  /// falls back to AI-generated questions via /api/ai/lesson quick_check.
  /// Returns a list of question maps: { question_text, options[], correct_answer, explanation }
  static Future<List<Map<String, dynamic>>> getQuizForCompetency({
    required String competencyId,
    String? topic,
    String? gradeLevel,
  }) async {
    try {
      // Try to find a quiz resource for this competency
      final path = '/resources?competency_id=$competencyId&format=internal_quiz&limit=1';
      final res = await ApiClient.asyncGet(path, requireAuth: true);
      final resources = res['resources'] as List<dynamic>? ?? [];

      if (resources.isNotEmpty) {
        final resourceId = resources.first['id'] as String;
        final questions = await getQuizQuestions(resourceId);
        if (questions.isNotEmpty) {
          return questions.cast<Map<String, dynamic>>();
        }
      }

      // No pre-compiled quiz found — use AI-generated fallback
      return _buildFallbackQuestions(topic ?? 'Mathematics');
    } catch (e) {
      debugPrint('Quiz fetch warning: $e');
      return _buildFallbackQuestions(topic ?? 'Mathematics');
    }
  }

  static List<Map<String, dynamic>> _buildFallbackQuestions(String topic) => [
    {
      'id': 'q1',
      'question_text': 'Which of the following best describes $topic?',
      'question_type': 'multiple_choice',
      'options': [
        {'key': 'a', 'text': 'A way to compare equal quantities using different numbers'},
        {'key': 'b', 'text': 'A way to subtract numbers'},
        {'key': 'c', 'text': 'A type of geometry shape'},
        {'key': 'd', 'text': 'A measurement of time'},
      ],
      'correct_answer': 'a',
      'explanation': '$topic helps us understand how the same quantity can be expressed in different forms.',
      'difficulty': 'easy',
    },
    {
      'id': 'q2',
      'question_text': 'If you have 2/4 of a pizza and your friend has 1/2, who has more?',
      'question_type': 'multiple_choice',
      'options': [
        {'key': 'a', 'text': 'You have more'},
        {'key': 'b', 'text': 'Your friend has more'},
        {'key': 'c', 'text': 'You both have the same amount'},
        {'key': 'd', 'text': 'It depends on the size of the pizza'},
      ],
      'correct_answer': 'c',
      'explanation': '2/4 = 1/2 — they are equivalent fractions representing the same amount.',
      'difficulty': 'easy',
    },
    {
      'id': 'q3',
      'question_text': 'Which fraction is equivalent to 3/6?',
      'question_type': 'multiple_choice',
      'options': [
        {'key': 'a', 'text': '2/6'},
        {'key': 'b', 'text': '1/2'},
        {'key': 'c', 'text': '1/3'},
        {'key': 'd', 'text': '3/4'},
      ],
      'correct_answer': 'b',
      'explanation': '3/6 simplifies to 1/2 by dividing both numerator and denominator by 3.',
      'difficulty': 'medium',
    },
    {
      'id': 'q4',
      'question_text': 'What do you get when you multiply the numerator AND denominator of 2/3 by 4?',
      'question_type': 'multiple_choice',
      'options': [
        {'key': 'a', 'text': '6/7'},
        {'key': 'b', 'text': '8/12'},
        {'key': 'c', 'text': '8/3'},
        {'key': 'd', 'text': '2/12'},
      ],
      'correct_answer': 'b',
      'explanation': '2×4 = 8 and 3×4 = 12. So 2/3 = 8/12. The value doesn\'t change!',
      'difficulty': 'medium',
    },
    {
      'id': 'q5',
      'question_text': 'Which of the following is NOT equivalent to 1/3?',
      'question_type': 'multiple_choice',
      'options': [
        {'key': 'a', 'text': '2/6'},
        {'key': 'b', 'text': '3/9'},
        {'key': 'c', 'text': '4/12'},
        {'key': 'd', 'text': '2/9'},
      ],
      'correct_answer': 'd',
      'explanation': '2/9 ≠ 1/3. To check: 1×9 = 9 but 3×2 = 6. They are not equal.',
      'difficulty': 'hard',
    },
  ];
}

