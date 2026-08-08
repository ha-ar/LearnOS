import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../providers/session_provider.dart';

class ReflectionScreen extends ConsumerStatefulWidget {
  const ReflectionScreen({super.key});

  @override
  ConsumerState<ReflectionScreen> createState() => _ReflectionScreenState();
}

class _ReflectionScreenState extends ConsumerState<ReflectionScreen> {
  int _confidence = 3;
  final TextEditingController _noteController = TextEditingController();
  bool _isSubmitting = false;

  final List<String> _reflectionPrompts = [
    "What was the most interesting thing you learned today?",
    "Is there anything that still feels confusing?",
    "How would you explain equivalent fractions to a friend?",
  ];

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _isSubmitting = true);
    await Future.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    ref.read(sessionProvider.notifier).submitReflection(_confidence, _noteController.text);
    context.go('/session-complete');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? AppColors.darkBackground : AppColors.lightBackground;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 620),
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Icon + title
                  Center(
                    child: Column(
                      children: [
                        Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.accentCyan.withValues(alpha: 0.12),
                            border: Border.all(
                              color: AppColors.accentCyan.withValues(alpha: 0.4),
                              width: 2,
                            ),
                          ),
                          child: const Icon(
                            Icons.self_improvement_rounded,
                            size: 36,
                            color: AppColors.accentCyan,
                          ),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          'Session Reflection',
                          style: AppTypography.titleLarge(isDark: isDark).copyWith(
                            fontWeight: FontWeight.w700,
                            fontSize: 26,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          "Take a moment to think about what you learned.",
                          style: AppTypography.bodyMedium(isDark: isDark).copyWith(
                            color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 36),

                  // Confidence section
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: surfaceColor,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: borderColor),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'How confident do you feel about Equivalent Fractions?',
                          style: AppTypography.titleSmall(isDark: isDark)
                              .copyWith(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 20),
                        // Star Rating
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(5, (i) {
                            final starValue = i + 1;
                            return GestureDetector(
                              onTap: () => setState(() => _confidence = starValue),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 8),
                                child: AnimatedScale(
                                  scale: _confidence >= starValue ? 1.2 : 1.0,
                                  duration: const Duration(milliseconds: 150),
                                  child: Icon(
                                    _confidence >= starValue
                                        ? Icons.star_rounded
                                        : Icons.star_outline_rounded,
                                    size: 40,
                                    color: _confidence >= starValue
                                        ? AppColors.warning
                                        : (isDark
                                            ? AppColors.textMutedDark
                                            : AppColors.textMutedLight),
                                  ),
                                ),
                              ),
                            );
                          }),
                        ),
                        const SizedBox(height: 12),
                        Center(
                          child: Text(
                            _confidenceLabel(_confidence),
                            style: AppTypography.labelMedium(isDark: isDark).copyWith(
                              color: AppColors.warning,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Reflection prompts
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: surfaceColor,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: borderColor),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Your Thoughts (optional)',
                          style: AppTypography.titleSmall(isDark: isDark)
                              .copyWith(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 8),

                        // Prompt suggestions
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: _reflectionPrompts.map((prompt) {
                            return GestureDetector(
                              onTap: () {
                                _noteController.text = prompt;
                                _noteController.selection = TextSelection.fromPosition(
                                  TextPosition(offset: _noteController.text.length),
                                );
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryContainer,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                                ),
                                child: Text(
                                  prompt,
                                  style: AppTypography.caption(isDark: isDark).copyWith(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),

                        const SizedBox(height: 14),

                        // Free-text note
                        TextField(
                          controller: _noteController,
                          maxLines: 4,
                          style: AppTypography.bodyMedium(isDark: isDark),
                          decoration: InputDecoration(
                            hintText: 'Write anything you want to remember...',
                            hintStyle: AppTypography.bodyMedium(isDark: isDark).copyWith(
                              color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                            ),
                            filled: true,
                            fillColor: isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: BorderSide(color: borderColor),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: BorderSide(color: borderColor),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: const BorderSide(color: AppColors.primary),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Submit button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isSubmitting ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.success,
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: AppColors.success.withValues(alpha: 0.5),
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: _isSubmitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2.5,
                              ),
                            )
                          : const Icon(Icons.check_circle_rounded, size: 20),
                      label: Text(
                        _isSubmitting ? 'Saving...' : 'Finish Session',
                        style: AppTypography.titleSmall(isDark: true).copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
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

  String _confidenceLabel(int stars) {
    switch (stars) {
      case 1:
        return 'I need more practice';
      case 2:
        return "I'm getting there";
      case 3:
        return 'I understand the basics';
      case 4:
        return 'I feel confident!';
      case 5:
        return 'I could teach this!';
      default:
        return '';
    }
  }
}
