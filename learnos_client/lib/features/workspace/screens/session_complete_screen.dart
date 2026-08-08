import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../providers/session_provider.dart';

class SessionCompleteScreen extends ConsumerStatefulWidget {
  final VoidCallback? onLogout;
  const SessionCompleteScreen({super.key, this.onLogout});

  @override
  ConsumerState<SessionCompleteScreen> createState() => _SessionCompleteScreenState();
}

class _SessionCompleteScreenState extends ConsumerState<SessionCompleteScreen>
    with TickerProviderStateMixin {
  late final AnimationController _badgeController;
  late final Animation<double> _badgeScale;
  late final Animation<double> _badgeFade;

  int _logoutCountdown = 60;
  Timer? _logoutTimer;

  @override
  void initState() {
    super.initState();

    // Badge entrance animation
    _badgeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _badgeScale = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(parent: _badgeController, curve: Curves.elasticOut),
    );
    _badgeFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _badgeController, curve: Curves.easeIn),
    );
    _badgeController.forward();

    // Auto-logout countdown
    _logoutTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_logoutCountdown > 0) {
        setState(() => _logoutCountdown--);
      } else {
        t.cancel();
        widget.onLogout?.call();
      }
    });
  }

  @override
  void dispose() {
    _badgeController.dispose();
    _logoutTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? AppColors.darkBackground : AppColors.lightBackground;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;

    final completedCount = session.tasks.where((t) => t.status == TaskStatus.completed).length;
    final elapsedMin = session.elapsedSeconds ~/ 60;

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 620),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Achievement Badge (animated)
                  FadeTransition(
                    opacity: _badgeFade,
                    child: ScaleTransition(
                      scale: _badgeScale,
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const RadialGradient(
                            colors: [
                              Color(0xFFFFD700),
                              Color(0xFFFFA500),
                            ],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFFFD700).withValues(alpha: 0.4),
                              blurRadius: 30,
                              spreadRadius: 8,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.emoji_events_rounded,
                          size: 60,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 28),

                  Text(
                    'Session Complete! 🎉',
                    style: AppTypography.titleLarge(isDark: isDark).copyWith(
                      fontWeight: FontWeight.w800,
                      fontSize: 28,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'See you next time, ${session.learnerName.split(' ').first}!',
                    style: AppTypography.bodyMedium(isDark: isDark).copyWith(
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      fontSize: 16,
                    ),
                    textAlign: TextAlign.center,
                  ),

                  const SizedBox(height: 36),

                  // Stats row
                  Row(
                    children: [
                      _statCard(
                        context: context,
                        icon: Icons.task_alt_rounded,
                        value: '$completedCount/${session.tasks.length}',
                        label: 'Tasks Done',
                        color: AppColors.success,
                        isDark: isDark,
                        surfaceColor: surfaceColor,
                        borderColor: borderColor,
                      ),
                      const SizedBox(width: 12),
                      _statCard(
                        context: context,
                        icon: Icons.timer_rounded,
                        value: '${elapsedMin}m',
                        label: 'Time Spent',
                        color: AppColors.primary,
                        isDark: isDark,
                        surfaceColor: surfaceColor,
                        borderColor: borderColor,
                      ),
                      const SizedBox(width: 12),
                      _statCard(
                        context: context,
                        icon: Icons.menu_book_rounded,
                        value: '1',
                        label: 'Topic Covered',
                        color: AppColors.accentCyan,
                        isDark: isDark,
                        surfaceColor: surfaceColor,
                        borderColor: borderColor,
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Concept covered card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: surfaceColor,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: borderColor),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.auto_awesome_rounded,
                            color: AppColors.primary, size: 20),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Concept Covered',
                                style: AppTypography.caption(isDark: isDark).copyWith(
                                  color: isDark
                                      ? AppColors.textMutedDark
                                      : AppColors.textMutedLight,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 0.6,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                session.competency,
                                style: AppTypography.bodyMedium(isDark: isDark).copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.success.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'Emerging',
                            style: AppTypography.badge(color: AppColors.success),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 36),

                  // Auto-logout countdown
                  Text(
                    'Logging out automatically in $_logoutCountdown seconds...',
                    style: AppTypography.caption(isDark: isDark).copyWith(
                      color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                    ),
                    textAlign: TextAlign.center,
                  ),

                  const SizedBox(height: 12),

                  // Manual logout
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        _logoutTimer?.cancel();
                        widget.onLogout?.call();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: const Icon(Icons.logout_rounded, size: 20),
                      label: Text(
                        'Log Out Now',
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

  Widget _statCard({
    required BuildContext context,
    required IconData icon,
    required String value,
    required String label,
    required Color color,
    required bool isDark,
    required Color surfaceColor,
    required Color borderColor,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        decoration: BoxDecoration(
          color: surfaceColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 6),
            Text(
              value,
              style: AppTypography.titleLarge(isDark: isDark).copyWith(
                fontWeight: FontWeight.w700,
                fontSize: 22,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: AppTypography.caption(isDark: isDark).copyWith(
                color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
