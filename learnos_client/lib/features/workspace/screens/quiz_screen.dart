import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/services/event_api_service.dart';
import '../../../data/services/resource_api_service.dart';
import '../providers/session_provider.dart';

class QuizScreen extends ConsumerStatefulWidget {
  const QuizScreen({super.key});

  @override
  ConsumerState<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends ConsumerState<QuizScreen> with TickerProviderStateMixin {
  int _currentQuestion = 0;
  int? _selectedOption;
  bool _hasAnswered = false;
  int _correctCount = 0;

  late final AnimationController _feedbackController;
  late final Animation<double> _feedbackAnimation;

  List<Map<String, dynamic>> _questions = [];
  bool _isLoadingQuestions = true;

  @override
  void initState() {
    super.initState();
    _feedbackController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );
    _feedbackAnimation = CurvedAnimation(
      parent: _feedbackController,
      curve: Curves.easeOut,
    );
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadQuestions());
  }

  Future<void> _loadQuestions() async {
    final session = ref.read(sessionProvider);
    final competencyId = session.competencyId ?? '';
    final topic = session.topic.isEmpty ? 'Mathematics' : session.topic;
    final questions = await ResourceApiService.getQuizForCompetency(
      competencyId: competencyId,
      topic: topic,
      gradeLevel: session.grade,
    );
    if (mounted) {
      setState(() {
        _questions = questions;
        _isLoadingQuestions = false;
      });
    }
  }

  @override
  void dispose() {
    _feedbackController.dispose();
    super.dispose();
  }

  void _selectOption(int index) {
    if (_hasAnswered || _questions.isEmpty) return;
    final q = _questions[_currentQuestion];
    final options = (q['options'] as List<dynamic>?) ?? [];
    final selectedKey = index < options.length ? options[index]['key'] as String : '';
    final correctKey = q['correct_answer'] as String? ?? 'a';
    final isCorrect = selectedKey == correctKey;
    setState(() {
      _selectedOption = index;
      _hasAnswered = true;
      if (isCorrect) _correctCount++;
    });
    _feedbackController.forward(from: 0);

    final session = ref.read(sessionProvider);
    EventApiService.logEvent(
      eventType: 'check_question_answered',
      sessionId: session.sessionId,
      learnerId: session.learnerId,
      tenantId: session.tenantId,
      payload: {
        'question_id': 'q-${_currentQuestion + 1}',
        'question_index': _currentQuestion,
        'selected_option': index,
        'is_correct': isCorrect,
      },
    );

    EventApiService.logEvent(
      eventType: isCorrect ? 'check_question_correct' : 'check_question_incorrect',
      sessionId: session.sessionId,
      learnerId: session.learnerId,
      tenantId: session.tenantId,
      payload: {'question_id': 'q-${_currentQuestion + 1}'},
    );
  }

  void _nextOrFinish() {
    if (_questions.isEmpty) return;
    if (_currentQuestion < _questions.length - 1) {
      setState(() {
        _currentQuestion++;
        _selectedOption = null;
        _hasAnswered = false;
      });
      _feedbackController.reset();
    } else {
      final session = ref.read(sessionProvider);
      EventApiService.logEvent(
        eventType: 'check_completed',
        sessionId: session.sessionId,
        learnerId: session.learnerId,
        tenantId: session.tenantId,
        payload: {
          'score': _correctCount,
          'total': _questions.length,
        },
      );

      // Quiz done — complete the practice task and go to reflection or workspace
      ref.read(sessionProvider.notifier).completeCurrentTask();
      final updatedSession = ref.read(sessionProvider);
      if (updatedSession.sessionComplete) {
        context.go('/reflection');
      } else if (updatedSession.activeTask?.type == 'reflect') {
        context.go('/reflection');
      } else {
        context.go('/workspace');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? AppColors.darkBackground : AppColors.lightBackground;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;

    if (_isLoadingQuestions) {
      return Scaffold(
        backgroundColor: bgColor,
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_questions.isEmpty) {
      return Scaffold(
        backgroundColor: bgColor,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.quiz_outlined, size: 48, color: Colors.grey),
              const SizedBox(height: 16),
              const Text('No questions available', style: TextStyle(fontSize: 16)),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => context.go('/workspace'),
                child: const Text('Back to Workspace'),
              ),
            ],
          ),
        ),
      );
    }

    final q = _questions[_currentQuestion];
    final options = (q['options'] as List<dynamic>?) ?? [];
    final questionText = q['question_text'] as String? ?? '';
    final explanation = q['explanation'] as String? ?? '';
    final correctKey = q['correct_answer'] as String? ?? 'a';
    final correctIndex = options.indexWhere((o) => o['key'] == correctKey);
    final progress = (_currentQuestion + 1) / _questions.length;

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 680),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header row
                  Row(
                    children: [
                      IconButton(
                        icon: Icon(
                          Icons.arrow_back_rounded,
                          color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                        ),
                        onPressed: () => context.go('/workspace'),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Practice Quiz',
                              style: AppTypography.titleSmall(isDark: isDark)
                                  .copyWith(fontWeight: FontWeight.w700),
                            ),
                            Text(
                              'Question ${_currentQuestion + 1} of ${_questions.length}',
                              style: AppTypography.caption(isDark: isDark).copyWith(
                                color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Score chip
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.success.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.star_rounded, color: AppColors.success, size: 14),
                            const SizedBox(width: 4),
                            Text(
                              '$_correctCount correct',
                              style: AppTypography.caption(isDark: isDark)
                                  .copyWith(color: AppColors.success, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Progress bar
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progress,
                      backgroundColor: isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                      minHeight: 6,
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Question card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: surfaceColor,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: borderColor),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.05),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primaryContainer,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'Equivalent Fractions',
                            style: AppTypography.badge(color: AppColors.primary),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          questionText,
                          style: AppTypography.titleMedium(isDark: isDark).copyWith(
                            fontWeight: FontWeight.w600,
                            fontSize: 18,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Options
                  ...options.asMap().entries.map((entry) {
                    final i = entry.key;
                    final optMap = entry.value as Map<String, dynamic>;
                    final optText = optMap['text'] as String? ?? '';
                    return _optionTile(context, i, optText, correctIndex, isDark, borderColor);
                  }),

                  const SizedBox(height: 16),

                  // Feedback card (animated)
                  if (_hasAnswered)
                    FadeTransition(
                      opacity: _feedbackAnimation,
                      child: SlideTransition(
                        position: Tween<Offset>(
                          begin: const Offset(0, 0.2),
                          end: Offset.zero,
                        ).animate(_feedbackAnimation),
                        child: _feedbackCard(explanation, correctIndex, isDark),
                      ),
                    ),

                  const Spacer(),

                  // Next / Finish button
                  if (_hasAnswered)
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _nextOrFinish,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        icon: Icon(
                          _currentQuestion < _questions.length - 1
                              ? Icons.arrow_forward_rounded
                              : Icons.check_circle_rounded,
                          size: 20,
                        ),
                        label: Text(
                          _currentQuestion < _questions.length - 1 ? 'Next Question' : 'Finish Quiz',
                          style: AppTypography.titleSmall(isDark: true).copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _optionTile(BuildContext context, int index, String option,
      int correctIndex, bool isDark, Color borderColor) {
    Color tileBg = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    Color tileBorder = borderColor;
    Widget? trailingIcon;

    if (_hasAnswered) {
      if (index == correctIndex) {
        tileBg = AppColors.success.withValues(alpha: 0.1);
        tileBorder = AppColors.success;
        trailingIcon = const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 20);
      } else if (index == _selectedOption && _selectedOption != correctIndex) {
        tileBg = AppColors.error.withValues(alpha: 0.08);
        tileBorder = AppColors.error;
        trailingIcon = const Icon(Icons.cancel_rounded, color: AppColors.error, size: 20);
      }
    } else if (_selectedOption == index) {
      tileBg = AppColors.primaryContainer;
      tileBorder = AppColors.primary;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: () => _selectOption(index),
        borderRadius: BorderRadius.circular(10),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: tileBg,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: tileBorder, width: 1.5),
          ),
          child: Row(
            children: [
              // Option letter badge
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: tileBorder.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    String.fromCharCode(65 + index), // A, B, C, D
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: _hasAnswered && index == correctIndex
                          ? AppColors.success
                          : (_hasAnswered && index == _selectedOption && index != correctIndex)
                              ? AppColors.error
                              : isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  option,
                  style: AppTypography.bodyMedium(isDark: isDark).copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              if (trailingIcon != null) trailingIcon,
            ],
          ),
        ),
      ),
    );
  }

  Widget _feedbackCard(String explanation, int correctIndex, bool isDark) {
    final isCorrect = _selectedOption == correctIndex;
    final color = isCorrect ? AppColors.success : AppColors.warning;
    final icon = isCorrect ? Icons.celebration_rounded : Icons.lightbulb_rounded;
    final title = isCorrect ? 'Correct! 🎉' : 'Not quite — here\'s why:';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: AppTypography.labelMedium(isDark: isDark)
                        .copyWith(color: color, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(explanation,
                    style: AppTypography.bodyMedium(isDark: isDark).copyWith(
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                    )),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
