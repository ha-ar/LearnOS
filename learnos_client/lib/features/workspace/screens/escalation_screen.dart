import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/services/event_api_service.dart';
import '../providers/session_provider.dart';

class EscalationScreen extends ConsumerStatefulWidget {
  const EscalationScreen({super.key});

  @override
  ConsumerState<EscalationScreen> createState() => _EscalationScreenState();
}

class _EscalationScreenState extends ConsumerState<EscalationScreen>
    with TickerProviderStateMixin {
  late final AnimationController _pulseController;
  late final Animation<double> _pulseAnimation;
  late final AnimationController _etaController;

  int _etaSeconds = 180; // 3 minutes ETA
  Timer? _etaTimer;
  bool _mentorArrived = false;

  @override
  void initState() {
    super.initState();

    // Pulse animation for the mentor avatar
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // ETA countdown timer
    _etaController = AnimationController(vsync: this);
    _etaTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_etaSeconds > 0) {
        setState(() => _etaSeconds--);
      } else {
        t.cancel();
        _pulseController.stop();
        setState(() => _mentorArrived = true);

        final session = ref.read(sessionProvider);
        EventApiService.logEvent(
          eventType: 'mentor_arrived',
          sessionId: session.sessionId,
          learnerId: session.learnerId,
          tenantId: session.tenantId,
          payload: {'mentor_name': 'Ms. Nadia'},
        );
        EventApiService.logEvent(
          eventType: 'mentor_escalation_resolved',
          sessionId: session.sessionId,
          learnerId: session.learnerId,
          tenantId: session.tenantId,
          payload: {'status': 'resolved'},
        );

        ref.read(sessionProvider.notifier).resolveEscalation();
      }
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _etaController.dispose();
    _etaTimer?.cancel();
    super.dispose();
  }

  String get _formattedEta {
    final m = _etaSeconds ~/ 60;
    final s = (_etaSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? AppColors.darkBackground : AppColors.lightBackground;

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: Padding(
              padding: const EdgeInsets.all(40),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Pulsing mentor avatar
                  ScaleTransition(
                    scale: _mentorArrived
                        ? const AlwaysStoppedAnimation(1.0)
                        : _pulseAnimation,
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _mentorArrived
                            ? AppColors.success.withValues(alpha: 0.15)
                            : AppColors.warning.withValues(alpha: 0.15),
                        border: Border.all(
                          color: _mentorArrived ? AppColors.success : AppColors.warning,
                          width: 2.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: (_mentorArrived ? AppColors.success : AppColors.warning)
                                .withValues(alpha: 0.3),
                            blurRadius: 24,
                            spreadRadius: 4,
                          ),
                        ],
                      ),
                      child: Icon(
                        _mentorArrived
                            ? Icons.check_circle_rounded
                            : Icons.person_rounded,
                        size: 48,
                        color: _mentorArrived ? AppColors.success : AppColors.warning,
                      ),
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Status title
                  Text(
                    _mentorArrived ? 'Mentor Has Arrived! 🎉' : 'Mentor Notified',
                    style: AppTypography.titleLarge(isDark: isDark).copyWith(
                      fontWeight: FontWeight.w700,
                      fontSize: 24,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 10),
                  Text(
                    _mentorArrived
                        ? 'Ms. Nadia is now with you. Ask your question!'
                        : 'Ms. Nadia has been notified and is on her way.',
                    style: AppTypography.bodyMedium(isDark: isDark).copyWith(
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                    ),
                    textAlign: TextAlign.center,
                  ),

                  const SizedBox(height: 32),

                  // ETA card
                  if (!_mentorArrived)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.warning.withValues(alpha: 0.4)),
                      ),
                      child: Column(
                        children: [
                          Text(
                            'Estimated wait time',
                            style: AppTypography.caption(isDark: isDark).copyWith(
                              color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            _formattedEta,
                            style: AppTypography.titleLarge(isDark: isDark).copyWith(
                              fontSize: 36,
                              fontWeight: FontWeight.w700,
                              color: AppColors.warning,
                              fontFeatures: const [FontFeature.tabularFigures()],
                            ),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: AppColors.warning,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'Ms. Nadia is walking over...',
                                style: AppTypography.caption(isDark: isDark).copyWith(
                                  color: AppColors.warning,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                  if (_mentorArrived)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.success.withValues(alpha: 0.4)),
                      ),
                      child: Text(
                        '"Hello Ahmed! I saw you had a question about equivalent fractions — let\'s work through it together."',
                        style: AppTypography.bodyMedium(isDark: isDark).copyWith(
                          color: AppColors.success,
                          fontStyle: FontStyle.italic,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),

                  const SizedBox(height: 40),

                  // Return to workspace button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        ref.read(sessionProvider.notifier).clearEscalation();
                        context.go('/workspace');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _mentorArrived ? AppColors.success : AppColors.primary,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: const Icon(Icons.arrow_back_rounded, size: 20),
                      label: Text(
                        'Return to Workspace',
                        style: AppTypography.titleSmall(isDark: true)
                            .copyWith(color: Colors.white, fontWeight: FontWeight.w600),
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
}
