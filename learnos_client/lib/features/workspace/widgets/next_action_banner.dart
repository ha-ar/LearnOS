import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../providers/session_provider.dart';

class NextActionBanner extends ConsumerWidget {
  final VoidCallback? onNextAction;

  const NextActionBanner({super.key, this.onNextAction});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;

    // Compute next action label and route based on current active task
    final activeTask = session.activeTask;
    if (activeTask == null) return const SizedBox.shrink();

    final (String label, String buttonText, IconData buttonIcon, VoidCallback action) =
        _nextActionFor(context, ref, activeTask);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: surfaceColor,
        border: Border(
          top: BorderSide(color: borderColor, width: 1),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.success.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.arrow_forward_rounded, color: AppColors.success, size: 18),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'NEXT RECOMMENDED STEP',
                  style: AppTypography.caption(isDark: isDark).copyWith(
                    letterSpacing: 0.8,
                    fontWeight: FontWeight.w700,
                    color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  style: AppTypography.bodyMedium(isDark: isDark).copyWith(
                    fontWeight: FontWeight.w600,
                    color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton.icon(
            onPressed: action,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            icon: Icon(buttonIcon, size: 16),
            label: Text(
              buttonText,
              style: AppTypography.titleSmall(isDark: true).copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  (String, String, IconData, VoidCallback) _nextActionFor(
      BuildContext context, WidgetRef ref, SessionTask task) {
    switch (task.type) {
      case 'review':
        return (
          'Complete the review, then move on to the video lesson.',
          'Mark Done',
          Icons.check_rounded,
          () => ref.read(sessionProvider.notifier).completeCurrentTask(),
        );
      case 'learn':
        return (
          "Finished watching the video? Try the 5-Question Practice Quiz next!",
          'Start Quiz',
          Icons.quiz_rounded,
          () => context.go('/quiz'),
        );
      case 'practice':
        return (
          'Complete the practice questions to finish this task.',
          'Open Quiz',
          Icons.quiz_rounded,
          () => context.go('/quiz'),
        );
      case 'reflect':
        return (
          "Great work! Take a moment to reflect on today's session.",
          'Reflect Now',
          Icons.self_improvement_rounded,
          () => context.go('/reflection'),
        );
      default:
        return (
          'Continue with your current task.',
          'Continue',
          Icons.arrow_forward_rounded,
          () {},
        );
    }
  }
}
