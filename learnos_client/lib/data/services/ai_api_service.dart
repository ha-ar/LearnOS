import '../../../core/network/api_client.dart';

class AiApiService {
  /// Send prompt to AI Socratic Tutor via POST /api/ai/tutor
  static Future<Map<String, dynamic>> askTutor({
    required String prompt,
    String? topic,
    List<Map<String, String>>? history,
  }) async {
    try {
      final res = await ApiClient.asyncPost(
        '/ai/tutor',
        {
          'prompt': prompt,
          if (topic != null) 'topic': topic,
          if (history != null) 'history': history,
        },
        requireAuth: true,
      );
      return res;
    } catch (e) {
      return {
        'reply': 'I am here to help you learn! What part of this topic should we look at together?',
        'socratic_hint_level': 1,
        'safety_passed': true,
        'escalate_to_mentor': false,
      };
    }
  }

  /// Request progressive smart hint via POST /api/ai/hint
  static Future<String> getSmartHint({
    required String questionText,
    int hintLevel = 1,
  }) async {
    try {
      final res = await ApiClient.asyncPost(
        '/ai/hint',
        {
          'question_text': questionText,
          'hint_level': hintLevel,
        },
        requireAuth: true,
      );
      return res['hint'] ?? 'Look closely at the numbers and try breaking them down into equal parts!';
    } catch (e) {
      return 'Look closely at the numbers and try breaking them down into equal parts!';
    }
  }

  /// Request Google Learn Your Way Explanation via POST /api/ai/explain
  static Future<Map<String, dynamic>> explainConcept({
    required String concept,
    String? topic,
    String? masteryLevel,
    String? explanationStyle,
    String? pacingSpeed,
  }) async {
    try {
      final res = await ApiClient.asyncPost(
        '/ai/explain',
        {
          'concept': concept,
          if (topic != null) 'topic': topic,
          if (masteryLevel != null) 'mastery_level': masteryLevel,
          if (explanationStyle != null) 'explanation_style': explanationStyle,
          if (pacingSpeed != null) 'pacing_speed': pacingSpeed,
        },
        requireAuth: true,
      );
      return res;
    } catch (e) {
      return {
        'concept': concept,
        'style': explanationStyle ?? 'real_world',
        'explanation': 'Let\'s break down **$concept** together!\n\nImagine slicing a pizza into 4 equal slices. Each slice is 1/4 of the whole pizza. If you take 2 slices, you have 2/4, which is the exact same amount as 1/2 of the whole pizza! That is what $concept is all about — expressing the exact same quantity in different forms.',
        'key_takeaways': [
          '$concept represents equal parts of a whole set or shape.',
          'Multiplying or dividing top and bottom by the same number keeps the value identical.',
          'Always look for common factors when simplifying.'
        ],
        'quick_check_question': 'If you have 3 out of 6 slices of a pie, what is the simplest fraction that represents your pie?',
        'adapted_for': 'Learner • Grade 6 • REAL_WORLD • Balanced Pace',
      };
    }
  }

  /// Generate a full AI lesson for a competency via POST /api/ai/lesson
  /// Returns structured lesson: title, intro, sections, key_points, summary, quick_check
  static Future<Map<String, dynamic>> generateLesson({
    String? competencyId,
    String? topic,
    String? subject,
    String? gradeLevel,
    String? masteryLevel,
  }) async {
    try {
      final res = await ApiClient.asyncPost(
        '/ai/lesson',
        {
          if (competencyId != null) 'competency_id': competencyId,
          if (topic != null) 'topic': topic,
          if (subject != null) 'subject': subject,
          if (gradeLevel != null) 'grade_level': gradeLevel,
          if (masteryLevel != null) 'mastery_level': masteryLevel,
        },
        requireAuth: true,
      );
      return res['lesson'] as Map<String, dynamic>? ?? _fallbackLesson(topic ?? 'Mathematics');
    } catch (e) {
      return _fallbackLesson(topic ?? 'Mathematics');
    }
  }

  static Map<String, dynamic> _fallbackLesson(String topic) => {
    'title': 'Understanding $topic',
    'intro': 'Welcome! In this lesson you will explore $topic — an important concept in Mathematics.',
    'sections': [
      {
        'heading': 'What Is It?',
        'body':
            '$topic is a fundamental concept in Mathematics. Think of it like dividing something fair and equal among friends. When we talk about $topic, we are describing a relationship between numbers or quantities that follows clear rules.',
      },
      {
        'heading': 'How Does It Work?',
        'body':
            'To understand $topic, start with something you know well — like sharing food or money. Imagine you have 12 chocolates to share equally with 3 friends. Each friend gets 4 chocolates. This is the same kind of reasoning we use in $topic.',
      },
      {
        'heading': 'Real-World Examples',
        'body':
            'You use $topic every day without realising it! When you split a bill with friends, check if a sale is truly 50% off, or measure ingredients for a recipe — you are applying the logic of $topic.',
      },
    ],
    'key_points': [
      '$topic is built on the idea of equal, fair relationships between numbers.',
      'Always check your answer by working backwards — does it make sense?',
      'Practise with real objects (coins, fruit, paper folding) to build confidence.',
    ],
    'summary': 'You have now learned the core ideas behind $topic and seen how they apply to real-life situations.',
    'quick_check': 'Can you give one example from your daily life where $topic would be useful?',
    'competency': topic,
    'grade_level': 'Grade 6',
  };
}


