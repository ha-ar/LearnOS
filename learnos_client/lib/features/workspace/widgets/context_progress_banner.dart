import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../providers/session_provider.dart';

class ContextProgressBanner extends ConsumerWidget {
  const ContextProgressBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    final borderColor = isDark ? AppColors.darkBorderSubtle : AppColors.lightBorderSubtle;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: surfaceColor,
        border: Border(
          bottom: BorderSide(color: borderColor, width: 1),
        ),
      ),
      child: Row(
        children: [
          // Active Competency Context Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        '${session.subject} • ${session.topic}',
                        style: AppTypography.caption(isDark: isDark).copyWith(
                          color: AppColors.accentCyan,
                          fontWeight: FontWeight.w600,
                        ),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    ),
                    const SizedBox(width: 8),
                    _masteryBadge(session.masteryLevel),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  session.competency,
                  style: AppTypography.titleSmall(isDark: isDark).copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ],
            ),
          ),

          const SizedBox(width: 16),

          // Session Tasks Step Timeline — live from session state
          Flexible(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: session.tasks.asMap().entries.map((entry) {
                  final i = entry.key;
                  final task = entry.value;
                  final isLast = i == session.tasks.length - 1;
                  return Row(
                    children: [
                      _taskStepPill(context, task, isDark),
                      if (!isLast)
                        Container(
                          width: 20,
                          height: 2,
                          color: task.status == TaskStatus.completed
                              ? AppColors.success.withValues(alpha: 0.6)
                              : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                        ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _masteryBadge(String level) {
    Color bg = AppColors.warning.withValues(alpha: 0.2);
    Color fg = AppColors.warning;
    String label = 'Emerging';

    if (level == 'proficient') {
      bg = AppColors.success.withValues(alpha: 0.2);
      fg = AppColors.success;
      label = 'Proficient';
    } else if (level == 'developing') {
      bg = AppColors.primary.withValues(alpha: 0.15);
      fg = AppColors.primary;
      label = 'Developing';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: fg.withValues(alpha: 0.4)),
      ),
      child: Text(
        label,
        style: AppTypography.badge(color: fg),
      ),
    );
  }

  Widget _taskStepPill(BuildContext context, SessionTask task, bool isDark) {
    final isCompleted = task.status == TaskStatus.completed;
    final isActive = task.status == TaskStatus.active;

    Color bg = isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated;
    Color fg = isDark ? AppColors.textMutedDark : AppColors.textMutedLight;
    IconData icon = Icons.circle_outlined;

    if (isCompleted) {
      bg = AppColors.success.withValues(alpha: 0.15);
      fg = AppColors.success;
      icon = Icons.check_circle_rounded;
    } else if (isActive) {
      bg = AppColors.primaryContainer;
      fg = AppColors.primary;
      icon = Icons.play_circle_fill_rounded;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isActive ? AppColors.primary : Colors.transparent,
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: fg),
          const SizedBox(width: 6),
          Text(
            task.title,
            style: AppTypography.caption(isDark: isDark).copyWith(
              color: fg,
              fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
