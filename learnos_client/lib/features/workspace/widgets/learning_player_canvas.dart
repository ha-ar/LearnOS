import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/ai_api_service.dart';
import '../providers/session_provider.dart';

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

class LessonSection {
  final String heading;
  final String body;
  const LessonSection({required this.heading, required this.body});

  factory LessonSection.fromMap(Map<String, dynamic> m) =>
      LessonSection(heading: m['heading'] ?? '', body: m['body'] ?? '');
}

class LessonData {
  final String title;
  final String intro;
  final List<LessonSection> sections;
  final List<String> keyPoints;
  final String summary;
  final String quickCheck;
  final String competency;
  final String gradeLevel;

  const LessonData({
    required this.title,
    required this.intro,
    required this.sections,
    required this.keyPoints,
    required this.summary,
    required this.quickCheck,
    required this.competency,
    required this.gradeLevel,
  });

  factory LessonData.fromMap(Map<String, dynamic> m) {
    final rawSections = (m['sections'] as List<dynamic>?) ?? [];
    final rawKeyPoints = (m['key_points'] as List<dynamic>?) ?? [];
    return LessonData(
      title: m['title'] ?? 'Lesson',
      intro: m['intro'] ?? '',
      sections: rawSections
          .whereType<Map<String, dynamic>>()
          .map(LessonSection.fromMap)
          .toList(),
      keyPoints: rawKeyPoints.map((e) => e.toString()).toList(),
      summary: m['summary'] ?? '',
      quickCheck: m['quick_check'] ?? '',
      competency: m['competency'] ?? '',
      gradeLevel: m['grade_level'] ?? 'Grade 6',
    );
  }
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

class LearningPlayerCanvas extends ConsumerStatefulWidget {
  const LearningPlayerCanvas({super.key});

  @override
  ConsumerState<LearningPlayerCanvas> createState() => _LearningPlayerCanvasState();
}

class _LearningPlayerCanvasState extends ConsumerState<LearningPlayerCanvas> {
  LessonData? _lesson;
  bool _isLoading = false;
  String? _error;
  String? _lastTopic;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadLesson());
  }

  Future<void> _loadLesson({bool forceRefresh = false}) async {
    final session = ref.read(sessionProvider);
    final topic = session.topic;

    // Don't reload if same topic
    if (!forceRefresh && _lastTopic == topic && _lesson != null) return;

    setState(() {
      _isLoading = true;
      _error = null;
      _lastTopic = topic;
    });

    try {
      final raw = await AiApiService.generateLesson(
        topic: topic,
        gradeLevel: session.grade,
        masteryLevel: session.masteryLevel,
      );
      if (mounted) {
        setState(() {
          _lesson = LessonData.fromMap(raw);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Could not load lesson. Tap to retry.';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Re-fetch if topic changes
    final currentTopic = session.topic;
    if (_lastTopic != currentTopic && !_isLoading) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _loadLesson());
    }

    final bgColor = isDark ? AppColors.darkBackground : AppColors.lightBackground;
    final cardColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textMuted = isDark ? AppColors.textMutedDark : AppColors.textMutedLight;

    return Container(
      color: bgColor,
      child: _isLoading
          ? _buildShimmer(isDark, cardColor, borderColor)
          : _error != null
              ? _buildError(isDark, textPrimary)
              : _lesson == null
                  ? _buildShimmer(isDark, cardColor, borderColor)
                  : _buildLesson(isDark, cardColor, borderColor, textPrimary, textMuted),
    );
  }

  // ---------------------------------------------------------------------------
  // Lesson Content Renderer
  // ---------------------------------------------------------------------------

  Widget _buildLesson(
    bool isDark,
    Color cardColor,
    Color borderColor,
    Color textPrimary,
    Color textMuted,
  ) {
    final lesson = _lesson!;
    final session = ref.read(sessionProvider);

    return Column(
      children: [
        // Lesson header bar
        _LessonHeaderBar(
          topic: lesson.competency.isNotEmpty ? lesson.competency : session.topic,
          gradeLevel: lesson.gradeLevel,
          onRefresh: () => _loadLesson(forceRefresh: true),
          isDark: isDark,
          borderColor: borderColor,
        ),

        // Scrollable lesson content
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Lesson title
                Text(
                  lesson.title,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: textPrimary,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 12),

                // Intro
                _IntroCard(text: lesson.intro, isDark: isDark),
                const SizedBox(height: 20),

                // Sections
                ...lesson.sections.asMap().entries.map((entry) {
                  final idx = entry.key;
                  final section = entry.value;
                  return _SectionCard(
                    index: idx + 1,
                    heading: section.heading,
                    body: section.body,
                    isDark: isDark,
                    cardColor: cardColor,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                    textMuted: textMuted,
                  );
                }),
                const SizedBox(height: 20),

                // Key Points
                if (lesson.keyPoints.isNotEmpty)
                  _KeyPointsCard(points: lesson.keyPoints, isDark: isDark),
                const SizedBox(height: 20),

                // Summary
                _SummaryCard(text: lesson.summary, isDark: isDark),
                const SizedBox(height: 20),

                // Quick check question
                if (lesson.quickCheck.isNotEmpty)
                  _QuickCheckCard(question: lesson.quickCheck, isDark: isDark),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Loading Shimmer
  // ---------------------------------------------------------------------------

  Widget _buildShimmer(bool isDark, Color cardColor, Color borderColor) {
    final shimmerBase = isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0);

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // AI generating indicator
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.accentCyan.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.accentCyan.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.accentCyan,
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  'AI is generating your personalised lesson...',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppColors.accentCyan,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          ...List.generate(4, (i) => _shimmerBar(shimmerBase, i)),
        ],
      ),
    );
  }

  Widget _shimmerBar(Color color, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      height: index == 0 ? 28 : 14,
      width: index == 1 ? 200 : double.infinity,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(8),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------

  Widget _buildError(bool isDark, Color textPrimary) {
    return Center(
      child: GestureDetector(
        onTap: () => _loadLesson(forceRefresh: true),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.refresh_rounded, size: 40, color: AppColors.accentCyan),
            const SizedBox(height: 12),
            Text(
              _error ?? 'Could not load lesson. Tap to retry.',
              style: TextStyle(color: textPrimary, fontSize: 14),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Sub-widgets
// ---------------------------------------------------------------------------

class _LessonHeaderBar extends StatelessWidget {
  final String topic;
  final String gradeLevel;
  final VoidCallback onRefresh;
  final bool isDark;
  final Color borderColor;

  const _LessonHeaderBar({
    required this.topic,
    required this.gradeLevel,
    required this.onRefresh,
    required this.isDark,
    required this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: borderColor, width: 1)),
        color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.accentCyan.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.auto_awesome, size: 13, color: AppColors.accentCyan),
                const SizedBox(width: 5),
                Text(
                  'AI Lesson',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.accentCyan,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              topic,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Text(
            gradeLevel,
            style: TextStyle(
              fontSize: 12,
              color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
            ),
          ),
          const SizedBox(width: 12),
          InkWell(
            onTap: onRefresh,
            borderRadius: BorderRadius.circular(6),
            child: Padding(
              padding: const EdgeInsets.all(4),
              child: Icon(
                Icons.refresh_rounded,
                size: 18,
                color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _IntroCard extends StatelessWidget {
  final String text;
  final bool isDark;
  const _IntroCard({required this.text, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: isDark
            ? const LinearGradient(
                colors: [Color(0xFF1E3A5F), Color(0xFF0F2A4F)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              )
            : const LinearGradient(
                colors: [Color(0xFFEFF6FF), Color(0xFFDBEAFE)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? AppColors.accentCyan.withValues(alpha: 0.2) : const Color(0xFF93C5FD),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.lightbulb_outline_rounded, size: 18, color: AppColors.accentCyan),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 14,
                height: 1.6,
                color: isDark ? AppColors.textPrimaryDark : const Color(0xFF1E40AF),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final int index;
  final String heading;
  final String body;
  final bool isDark;
  final Color cardColor;
  final Color borderColor;
  final Color textPrimary;
  final Color textMuted;

  const _SectionCard({
    required this.index,
    required this.heading,
    required this.body,
    required this.isDark,
    required this.cardColor,
    required this.borderColor,
    required this.textPrimary,
    required this.textMuted,
  });

  static const _accent = [
    AppColors.accentCyan,
    Color(0xFF8B5CF6),
    Color(0xFF10B981),
  ];

  @override
  Widget build(BuildContext context) {
    final color = _accent[(index - 1) % _accent.length];
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    '$index',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  heading,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: textPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Container(height: 1, color: borderColor),
          const SizedBox(height: 10),
          Text(
            body,
            style: TextStyle(
              fontSize: 14,
              height: 1.7,
              color: textMuted,
            ),
          ),
        ],
      ),
    );
  }
}

class _KeyPointsCard extends StatelessWidget {
  final List<String> points;
  final bool isDark;
  const _KeyPointsCard({required this.points, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF16213E) : const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? const Color(0xFF10B981).withValues(alpha: 0.25) : const Color(0xFFBBF7D0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.check_circle_outline_rounded, size: 16, color: const Color(0xFF10B981)),
              const SizedBox(width: 8),
              Text(
                'Key Points',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF10B981),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ...points.map((p) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFF10B981),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        p,
                        style: TextStyle(
                          fontSize: 13,
                          height: 1.6,
                          color: isDark ? AppColors.textPrimaryDark : const Color(0xFF14532D),
                        ),
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String text;
  final bool isDark;
  const _SummaryCard({required this.text, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1B4B) : const Color(0xFFF5F3FF),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? const Color(0xFF8B5CF6).withValues(alpha: 0.3) : const Color(0xFFC4B5FD),
        ),
      ),
      child: Row(
        children: [
          Icon(Icons.summarize_outlined, size: 16, color: const Color(0xFF8B5CF6)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 13,
                height: 1.6,
                color: isDark ? AppColors.textPrimaryDark : const Color(0xFF4C1D95),
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickCheckCard extends StatelessWidget {
  final String question;
  final bool isDark;
  const _QuickCheckCard({required this.question, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: isDark
            ? const LinearGradient(
                colors: [Color(0xFF451A03), Color(0xFF2C1A03)],
              )
            : const LinearGradient(
                colors: [Color(0xFFFFFBEB), Color(0xFFFEF3C7)],
              ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? const Color(0xFFF59E0B).withValues(alpha: 0.3) : const Color(0xFFFCD34D),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.quiz_outlined, size: 16, color: const Color(0xFFF59E0B)),
              const SizedBox(width: 8),
              Text(
                'Quick Check',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFFF59E0B),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            question,
            style: TextStyle(
              fontSize: 14,
              height: 1.6,
              color: isDark ? AppColors.textPrimaryDark : const Color(0xFF78350F),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
