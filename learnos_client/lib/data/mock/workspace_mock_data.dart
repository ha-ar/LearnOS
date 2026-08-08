class MockTaskItem {
  final String id;
  final int order;
  final String taskType; // 'review', 'learn', 'practice', 'reflect'
  final String title;
  final String durationText;
  final String status; // 'completed', 'active', 'pending'

  const MockTaskItem({
    required this.id,
    required this.order,
    required this.taskType,
    required this.title,
    required this.durationText,
    required this.status,
  });
}

class MockQuizQuestion {
  final String id;
  final String questionText;
  final List<String> options;
  final int correctIndex;
  final String explanation;

  const MockQuizQuestion({
    required this.id,
    required this.questionText,
    required this.options,
    required this.correctIndex,
    required this.explanation,
  });
}

class WorkspaceMockData {
  static const String learnerName = "Ahmed Khan";
  static const String grade = "Grade 6";
  static const String subject = "Mathematics";
  static const String topic = "Equivalent Fractions";
  static const String competency = "Finding and verifying equivalent fractions";
  static const String masteryLevel = "emerging"; // emerging, developing, proficient
  static const int sessionTimeElapsedSec = 1420; // 23 mins 40 secs
  static const int totalSessionDurationMin = 40;

  static const List<MockTaskItem> tasks = [
    MockTaskItem(
      id: 't1',
      order: 1,
      taskType: 'review',
      title: 'Basic Fractions Review',
      durationText: '10 min',
      status: 'completed',
    ),
    MockTaskItem(
      id: 't2',
      order: 2,
      taskType: 'learn',
      title: 'Equivalent Fractions Lesson',
      durationText: '15 min',
      status: 'active',
    ),
    MockTaskItem(
      id: 't3',
      order: 3,
      taskType: 'practice',
      title: 'Practice Quiz (5 Questions)',
      durationText: '10 min',
      status: 'pending',
    ),
    MockTaskItem(
      id: 't4',
      order: 4,
      taskType: 'reflect',
      title: 'Session Reflection',
      durationText: '5 min',
      status: 'pending',
    ),
  ];

  static const List<MockQuizQuestion> quizQuestions = [
    MockQuizQuestion(
      id: 'q1',
      questionText: 'Which of the following fractions is equivalent to 1/2?',
      options: ['2/3', '2/4', '3/4', '4/5'],
      correctIndex: 1,
      explanation: '1/2 = 2/4 because both numerator and denominator are multiplied by 2.',
    ),
    MockQuizQuestion(
      id: 'q2',
      questionText: 'Which fraction is equivalent to 2/3?',
      options: ['4/6', '3/5', '4/5', '6/8'],
      correctIndex: 0,
      explanation: '2/3 = 4/6 because 2×2=4 and 3×2=6.',
    ),
  ];

  static const List<Map<String, String>> aiSuggestedPrompts = [
    {"label": "Why did we multiply by 2?", "icon": "help"},
    {"label": "Can you give me a worked example?", "icon": "lightbulb"},
    {"label": "Explain this with shapes", "icon": "category"},
  ];

  static const List<Map<String, dynamic>> aiChatHistory = [
    {
      "sender": "ai",
      "text": "Hi Ahmed! We're learning about Equivalent Fractions today. Notice how 1/2 and 2/4 represent the exact same amount of a pizza!",
      "time": "10:15 AM"
    },
    {
      "sender": "user",
      "text": "Why did we multiply both the top and bottom by 2?",
      "time": "10:18 AM"
    },
    {
      "sender": "ai",
      "text": "Great question! When you multiply both top (numerator) and bottom (denominator) by 2, you cut each slice into 2 smaller pieces, but the total amount of pizza remains unchanged!",
      "time": "10:18 AM"
    },
  ];
}
