import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../auth/models/auth_user.dart';
import '../providers/session_provider.dart';
import 'kiosk_exit_button.dart';

class HeaderBar extends ConsumerWidget {
  final bool isAiOpen;
  final bool isToolsOpen;
  final VoidCallback onToggleAi;
  final VoidCallback onToggleTools;
  final VoidCallback onToggleTheme;
  final AuthUser? currentUser;

  const HeaderBar({
    super.key,
    required this.isAiOpen,
    required this.isToolsOpen,
    required this.onToggleAi,
    required this.onToggleTools,
    required this.onToggleTheme,
    this.currentUser,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final surfaceElevated =
        isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated;

    final displayName = currentUser?.name ?? session.learnerName;
    final displayGrade = currentUser?.grade ?? session.grade;
    final displayRole = currentUser?.role.toUpperCase() ?? 'LEARNER';

    // Determine timer color: red when < 5 minutes remain
    final isLowTime = session.remainingSeconds < 300;
    final timerColor = isLowTime ? AppColors.error : AppColors.success;

    return Container(
      height: 54,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: surfaceColor,
        border: Border(
          bottom: BorderSide(color: borderColor, width: 1),
        ),
      ),
      child: Row(
        children: [
          // No traffic light spacer — buttons are hidden in kiosk mode
          const SizedBox(width: 16),

          // App Logo & Learner Identity
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.primaryContainer,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.school_rounded, color: AppColors.primary, size: 16),
                const SizedBox(width: 6),
                Text(
                  'LearnOS',
                  style: AppTypography.titleSmall(isDark: isDark).copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Text(
            '$displayName ($displayGrade)',
            style: AppTypography.bodyMedium(isDark: isDark).copyWith(
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.accentCyan.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              displayRole,
              style: const TextStyle(
                  fontSize: 10, color: AppColors.accentCyan, fontWeight: FontWeight.bold),
            ),
          ),

          const Spacer(),

          // Live Session Timer Pill
          AnimatedContainer(
            duration: const Duration(milliseconds: 400),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: isLowTime
                  ? AppColors.error.withValues(alpha: 0.1)
                  : surfaceElevated,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isLowTime ? AppColors.error.withValues(alpha: 0.5) : borderColor,
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: timerColor,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${session.formattedElapsed} / ${session.totalDurationMin} min',
                  style: AppTypography.labelMedium(isDark: isDark).copyWith(
                    fontWeight: FontWeight.w600,
                    color: isLowTime ? AppColors.error : null,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),

          // Theme toggle
          _headerIconButton(
            context: context,
            icon: isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
            tooltip: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
            isActive: false,
            onPressed: onToggleTheme,
          ),
          const SizedBox(width: 8),

          // Tools toggle
          _headerIconButton(
            context: context,
            icon: Icons.edit_note_rounded,
            tooltip: 'Scratchpad & Notes',
            isActive: isToolsOpen,
            onPressed: onToggleTools,
          ),
          const SizedBox(width: 8),

          // AI toggle
          _headerIconButton(
            context: context,
            icon: Icons.auto_awesome_rounded,
            tooltip: 'AI Learning Companion',
            isActive: isAiOpen,
            activeColor: AppColors.primary,
            onPressed: onToggleAi,
          ),

          // Kiosk exit button — the ONLY way to close the app
          const SizedBox(width: 12),
          const KioskExitButton(),
        ],
      ),
    );
  }

  Widget _headerIconButton({
    required BuildContext context,
    required IconData icon,
    required String tooltip,
    required bool isActive,
    Color activeColor = AppColors.primary,
    required VoidCallback onPressed,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final surfaceElevated =
        isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated;
    final defaultIconColor =
        isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(8),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isActive ? activeColor.withValues(alpha: 0.2) : surfaceElevated,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isActive ? activeColor : borderColor,
              width: 1,
            ),
          ),
          child: Icon(
            icon,
            size: 18,
            color: isActive ? activeColor : defaultIconColor,
          ),
        ),
      ),
    );
  }
}
