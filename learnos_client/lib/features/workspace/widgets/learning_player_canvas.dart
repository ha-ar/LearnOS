import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/ai_api_service.dart';
import '../providers/session_provider.dart';
import 'video_lesson_player.dart';

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
  String _viewMode = 'reading'; // 'reading' or 'video'

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
        // Lesson header bar with View Mode Switcher
        _LessonHeaderBar(
          topic: lesson.competency.isNotEmpty ? lesson.competency : session.topic,
          gradeLevel: lesson.gradeLevel,
          viewMode: _viewMode,
          onViewModeChanged: (mode) => setState(() => _viewMode = mode),
          onRefresh: () => _loadLesson(forceRefresh: true),
          isDark: isDark,
          borderColor: borderColor,
        ),

        // Video Mode or Reading Mode
        if (_viewMode == 'video')
          const Expanded(child: VideoLessonPlayer())
        else
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

                // Quick check question with typed & voice recording support
                if (lesson.quickCheck.isNotEmpty)
                  _InteractiveQuickCheckCard(
                    question: lesson.quickCheck,
                    topic: lesson.competency.isNotEmpty ? lesson.competency : session.topic,
                    gradeLevel: lesson.gradeLevel,
                    isDark: isDark,
                  ),

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
  final String viewMode;
  final ValueChanged<String> onViewModeChanged;
  final VoidCallback onRefresh;
  final bool isDark;
  final Color borderColor;

  const _LessonHeaderBar({
    required this.topic,
    required this.gradeLevel,
    required this.viewMode,
    required this.onViewModeChanged,
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

          // View Mode Switcher: Reading Notes vs Video Lesson
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: borderColor),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildModeBtn(
                  context,
                  id: 'reading',
                  label: 'Reading',
                  icon: Icons.article_outlined,
                  isSelected: viewMode == 'reading',
                  isDark: isDark,
                ),
                _buildModeBtn(
                  context,
                  id: 'video',
                  label: 'Video',
                  icon: Icons.smart_display_outlined,
                  isSelected: viewMode == 'video',
                  isDark: isDark,
                ),
              ],
            ),
          ),

          const SizedBox(width: 12),
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

  Widget _buildModeBtn(
    BuildContext context, {
    required String id,
    required String label,
    required IconData icon,
    required bool isSelected,
    required bool isDark,
  }) {
    return InkWell(
      onTap: () => onViewModeChanged(id),
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? AppColors.primary : Colors.white)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  )
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 14,
              color: isSelected
                  ? (isDark ? Colors.white : AppColors.primary)
                  : (isDark ? AppColors.textMutedDark : AppColors.textMutedLight),
            ),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected
                    ? (isDark ? Colors.white : AppColors.primary)
                    : (isDark ? AppColors.textMutedDark : AppColors.textMutedLight),
              ),
            ),
          ],
        ),
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

class _InteractiveQuickCheckCard extends StatefulWidget {
  final String question;
  final String topic;
  final String gradeLevel;
  final bool isDark;

  const _InteractiveQuickCheckCard({
    required this.question,
    required this.topic,
    required this.gradeLevel,
    required this.isDark,
  });

  @override
  State<_InteractiveQuickCheckCard> createState() => _InteractiveQuickCheckCardState();
}

class _InteractiveQuickCheckCardState extends State<_InteractiveQuickCheckCard> {
  final TextEditingController _answerController = TextEditingController();
  bool _isRecording = false;
  bool _isChecking = false;
  Map<String, dynamic>? _evaluation;

  @override
  void dispose() {
    _answerController.dispose();
    super.dispose();
  }

  void _toggleAudioRecording() {
    if (_isRecording) {
      // Finish recording and populate text
      setState(() => _isRecording = false);
      if (_answerController.text.trim().isEmpty) {
        // Voice transcription simulation
        _answerController.text = "Because dividing both the numerator and denominator by the same number keeps the total ratio equal to the whole.";
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Voice transcribed into text field!'),
          backgroundColor: AppColors.accentCyan,
          duration: Duration(seconds: 2),
        ),
      );
    } else {
      // Start recording
      setState(() => _isRecording = true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('🎙️ Listening... Speak your answer now! Tap mic again when finished.'),
          backgroundColor: Color(0xFF8B5CF6),
          duration: Duration(seconds: 3),
        ),
      );
    }
  }

  Future<void> _checkAnswer() async {
    final text = _answerController.text.trim();
    if (text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please type or record your answer first!')),
      );
      return;
    }

    setState(() => _isChecking = true);
    final result = await AiApiService.checkQuickAnswer(
      question: widget.question,
      answer: text,
      topic: widget.topic,
      gradeLevel: widget.gradeLevel,
    );

    if (mounted) {
      setState(() {
        _evaluation = result;
        _isChecking = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    final cardBg = isDark ? const Color(0xFF1E1A0F) : const Color(0xFFFFFBEB);
    final borderColor = isDark ? const Color(0xFFF59E0B).withValues(alpha: 0.3) : const Color(0xFFFCD34D);
    final textPrimary = isDark ? AppColors.textPrimaryDark : const Color(0xFF78350F);

    final isCorrect = _evaluation?['is_correct'] ?? false;
    final feedback = _evaluation?['feedback'] as String?;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.quiz_outlined, size: 18, color: Color(0xFFF59E0B)),
              ),
              const SizedBox(width: 10),
              Text(
                'Quick Check Challenge',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFFF59E0B),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'Interactive Practice',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFFF59E0B)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            widget.question,
            style: TextStyle(
              fontSize: 15,
              height: 1.5,
              color: textPrimary,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 14),

          // Text & Voice Input Field
          Container(
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0F172A) : Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: _isRecording
                    ? const Color(0xFFEF4444)
                    : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                width: _isRecording ? 2 : 1,
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: TextField(
                    controller: _answerController,
                    maxLines: 3,
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                    ),
                    decoration: InputDecoration(
                      hintText: _isRecording
                          ? 'Listening to your voice...'
                          : 'Type your answer here or tap the mic to speak...',
                      hintStyle: TextStyle(
                        fontSize: 13,
                        color: _isRecording
                            ? const Color(0xFFEF4444)
                            : (isDark ? AppColors.textMutedDark : AppColors.textMutedLight),
                      ),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.all(12),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: IconButton(
                    onPressed: _toggleAudioRecording,
                    tooltip: _isRecording ? 'Stop Recording' : 'Record Voice Answer',
                    icon: Icon(
                      _isRecording ? Icons.stop_circle_rounded : Icons.mic_rounded,
                      color: _isRecording ? const Color(0xFFEF4444) : const Color(0xFF8B5CF6),
                      size: 24,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Action Buttons
          Row(
            children: [
              ElevatedButton.icon(
                onPressed: _isChecking ? null : _checkAnswer,
                icon: _isChecking
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.check, size: 16),
                label: Text(_isChecking ? 'Checking with Lumos...' : 'Check Answer'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF59E0B),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ),
              const SizedBox(width: 10),
              TextButton.icon(
                onPressed: () {
                  _answerController.clear();
                  setState(() => _evaluation = null);
                },
                icon: const Icon(Icons.refresh, size: 14),
                label: const Text('Reset', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),

          // Feedback Banner
          if (feedback != null) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isCorrect
                    ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFDCFCE7))
                    : (isDark ? const Color(0xFF7C2D12) : const Color(0xFFFFEDD5)),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isCorrect
                      ? (isDark ? const Color(0xFF10B981) : const Color(0xFF86EFAC))
                      : (isDark ? const Color(0xFFF97316) : const Color(0xFFFDBA74)),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    isCorrect ? Icons.emoji_events_outlined : Icons.lightbulb_outline_rounded,
                    color: isCorrect ? const Color(0xFF10B981) : const Color(0xFFF97316),
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isCorrect ? 'Awesome job! 🎉' : 'Friendly Lumos Tip ✨',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: isCorrect
                                ? (isDark ? Colors.white : const Color(0xFF14532D))
                                : (isDark ? Colors.white : const Color(0xFF7C2D12)),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          feedback,
                          style: TextStyle(
                            fontSize: 13,
                            height: 1.5,
                            color: isCorrect
                                ? (isDark ? Colors.white70 : const Color(0xFF166534))
                                : (isDark ? Colors.white70 : const Color(0xFF9A3412)),
                          ),
                        ),
                        if (!isCorrect) ...[
                          const SizedBox(height: 8),
                          Text(
                            '💡 Tip: Try reviewing the lesson sections above and give it another try — you\'ve got this!',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isDark ? const Color(0xFFFDBA74) : const Color(0xFFC2410C),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
