import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/session_provider.dart';

class MissionScreen extends ConsumerStatefulWidget {
  final VoidCallback? onToggleTheme;

  const MissionScreen({super.key, this.onToggleTheme});

  @override
  ConsumerState<MissionScreen> createState() => _MissionScreenState();
}

class _MissionScreenState extends ConsumerState<MissionScreen> {
  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final bgColor = isDark ? AppColors.darkBackground : AppColors.lightBackground;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textMuted = isDark ? AppColors.textMutedDark : AppColors.textMutedLight;

    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'Good morning'
        : hour < 17
            ? 'Good afternoon'
            : 'Good evening';

    if (session.isLoading) {
      return Scaffold(
        backgroundColor: bgColor,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: isDark ? AppColors.accentCyan : AppColors.primary),
              const SizedBox(height: 16),
              Text(
                'Loading your personalized daily mission from LearnOS Cloud...',
                style: TextStyle(color: textPrimary, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 860),
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top Brand, Theme Toggle & Profile Header Row
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: AppTheme.bentoDecoration(
                          color: surfaceColor,
                          borderRadius: 24,
                          isDark: isDark,
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: isDark ? AppColors.accentCyan : AppColors.primary,
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.school_rounded,
                                color: isDark ? Colors.black : Colors.white,
                                size: 14,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'LearnOS Platform',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const Spacer(),

                      // Theme Toggle Button
                      if (widget.onToggleTheme != null)
                        IconButton(
                          onPressed: widget.onToggleTheme,
                          icon: Icon(
                            isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                            color: textPrimary,
                            size: 20,
                          ),
                          tooltip: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
                        ),

                      const SizedBox(width: 8),

                      // Profile Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: AppTheme.bentoDecoration(
                          color: isDark ? AppColors.darkSurfaceElevated : AppColors.pastelBlue,
                          borderColor: isDark ? AppColors.darkBorder : AppColors.pastelBlueText.withValues(alpha: 0.2),
                          borderRadius: 24,
                          hasShadow: false,
                          isDark: isDark,
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.person_pin_rounded,
                              size: 16,
                              color: isDark ? AppColors.accentCyan : AppColors.pastelBlueText,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              session.learnerName,
                              style: TextStyle(
                                color: isDark ? AppColors.textPrimaryDark : AppColors.pastelBlueText,
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 28),

                  // Greeting Section
                  Text(
                    '$greeting, ${session.learnerName.split(' ').first}! 👋',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formattedDate(),
                    style: TextStyle(
                      fontSize: 14,
                      color: textMuted,
                      fontWeight: FontWeight.w500,
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Bento Grid Top Row: Big Goal Card + Quick Stat Pill Cards
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Goal Bento Card (Main Hero)
                      Expanded(
                        flex: 3,
                        child: Container(
                          padding: const EdgeInsets.all(24),
                          decoration: AppTheme.bentoDecoration(
                            color: surfaceColor,
                            borderRadius: 24,
                            isDark: isDark,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: isDark ? AppColors.darkSurfaceElevated : AppColors.pastelLavender,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Icon(
                                      Icons.flag_rounded,
                                      color: isDark ? AppColors.accentCyan : AppColors.pastelLavenderText,
                                      size: 20,
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Text(
                                    "TODAY'S MISSION GOAL",
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: isDark ? AppColors.accentCyan : AppColors.pastelLavenderText,
                                      letterSpacing: 1.0,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                session.goal,
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: textPrimary,
                                  height: 1.4,
                                ),
                              ),
                              const SizedBox(height: 20),
                              Row(
                                children: [
                                  _bentoMiniTag(
                                    icon: Icons.timer_outlined,
                                    label: '${session.totalDurationMin} mins',
                                    color: isDark ? AppColors.darkSurfaceElevated : AppColors.pastelMint,
                                    textColor: isDark ? AppColors.success : AppColors.pastelMintText,
                                  ),
                                  const SizedBox(width: 8),
                                  _bentoMiniTag(
                                    icon: Icons.menu_book_rounded,
                                    label: '${session.subject} • ${session.topic}',
                                    color: isDark ? AppColors.darkSurfaceElevated : AppColors.pastelBlue,
                                    textColor: isDark ? AppColors.accentCyan : AppColors.pastelBlueText,
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(width: 16),

                      // Side Stat Bento Card (Micro Metrics)
                      Expanded(
                        flex: 2,
                        child: Column(
                          children: [
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(18),
                              decoration: AppTheme.bentoDecoration(
                                color: isDark ? AppColors.darkSurface : AppColors.pastelMint,
                                borderColor: isDark ? AppColors.success.withValues(alpha: 0.3) : AppColors.pastelMintText.withValues(alpha: 0.15),
                                borderRadius: 24,
                                hasShadow: false,
                                isDark: isDark,
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '83%',
                                    style: TextStyle(
                                      fontSize: 32,
                                      fontWeight: FontWeight.w800,
                                      color: isDark ? AppColors.success : AppColors.pastelMintText,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Mastery Level: ${session.masteryLevel.toUpperCase()}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: isDark ? AppColors.success : AppColors.pastelMintText,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 12),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(18),
                              decoration: AppTheme.bentoDecoration(
                                color: isDark ? AppColors.darkSurface : AppColors.pastelPeach,
                                borderColor: isDark ? AppColors.warning.withValues(alpha: 0.3) : AppColors.pastelPeachText.withValues(alpha: 0.15),
                                borderRadius: 24,
                                hasShadow: false,
                                isDark: isDark,
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '4 Tasks',
                                    style: TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.w800,
                                      color: isDark ? AppColors.warning : AppColors.pastelPeachText,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Guided Learning Sequence',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: isDark ? AppColors.warning : AppColors.pastelPeachText,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 28),

                  // Today's Learning Sequence Bento Container
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: AppTheme.bentoDecoration(
                      color: surfaceColor,
                      borderRadius: 24,
                      isDark: isDark,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Today's Learning Sequence",
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: textPrimary,
                          ),
                        ),
                        const SizedBox(height: 16),
                        ...session.tasks.asMap().entries.map((entry) {
                          final i = entry.key;
                          final task = entry.value;
                          return _taskPreviewRow(context, task, i, isDark);
                        }),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Start Mission Pill Action Button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        ref.read(sessionProvider.notifier).startSession();
                        context.go('/workspace');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isDark ? AppColors.accentCyan : AppColors.primary,
                        foregroundColor: isDark ? Colors.black : Colors.white,
                        elevation: 0,
                        shape: const StadiumBorder(),
                      ),
                      icon: Icon(Icons.play_arrow_rounded, size: 22, color: isDark ? Colors.black : Colors.white),
                      label: Text(
                        "Start Today's Mission",
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.black : Colors.white,
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

  Widget _bentoMiniTag({
    required IconData icon,
    required String label,
    required Color color,
    required Color textColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: textColor),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textColor),
          ),
        ],
      ),
    );
  }

  Widget _taskPreviewRow(BuildContext context, SessionTask task, int index, bool isDark) {
    final isCompleted = task.status == TaskStatus.completed;
    final rowBg = isCompleted
        ? (isDark ? AppColors.success.withValues(alpha: 0.15) : AppColors.pastelMint)
        : (isDark ? AppColors.darkSurfaceElevated : AppColors.lightBackground);
    final rowText = isCompleted
        ? (isDark ? AppColors.success : AppColors.pastelMintText)
        : (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: rowBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isCompleted
                ? (isDark ? AppColors.success.withValues(alpha: 0.3) : AppColors.pastelMintText.withValues(alpha: 0.2))
                : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isCompleted
                    ? (isDark ? AppColors.success : AppColors.pastelMintText)
                    : (isDark ? AppColors.accentCyan : AppColors.primary),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: isCompleted
                    ? Icon(Icons.check_rounded, size: 16, color: isDark ? Colors.black : Colors.white)
                    : Text(
                        '${index + 1}',
                        style: TextStyle(
                          color: isDark ? Colors.black : Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                task.title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: rowText,
                  decoration: isCompleted ? TextDecoration.lineThrough : null,
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
              ),
              child: Text(
                '${task.durationMin} min',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formattedDate() {
    final now = DateTime.now();
    const months = [
      '', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return '${days[now.weekday - 1]}, ${months[now.month]} ${now.day}, ${now.year}';
  }
}
