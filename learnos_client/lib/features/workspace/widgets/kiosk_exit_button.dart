import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/services/app_exit_service.dart';
import '../providers/session_provider.dart';

/// Custom kiosk exit button shown in the header bar.
/// Tapping opens a confirmation dialog that:
///   1. Asks the learner to confirm with a reason dropdown.
///   2. Fires POST /sessions/:id/exit-app to notify the mentor/parent.
///   3. Closes the macOS window.
class KioskExitButton extends ConsumerWidget {
  const KioskExitButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Tooltip(
      message: 'End Session & Exit App',
      child: InkWell(
        onTap: () => _showExitDialog(context, ref, isDark),
        borderRadius: BorderRadius.circular(8),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          decoration: BoxDecoration(
            color: AppColors.error.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.error.withValues(alpha: 0.35), width: 1),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.logout_rounded, size: 15, color: AppColors.error),
              const SizedBox(width: 6),
              Text(
                'End Session',
                style: AppTypography.labelMedium(isDark: isDark).copyWith(
                  color: AppColors.error,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _showExitDialog(BuildContext context, WidgetRef ref, bool isDark) async {
    final session = ref.read(sessionProvider);
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => _ExitConfirmDialog(
        sessionId: session.sessionId,
        learnerName: session.learnerName,
        elapsedSeconds: session.elapsedSeconds,
        tasksCompleted: session.tasks.where((t) => t.status == TaskStatus.completed).length,
        tasksTotal: session.tasks.length,
        isDark: isDark,
      ),
    );
  }
}

class _ExitConfirmDialog extends StatefulWidget {
  final String sessionId;
  final String learnerName;
  final int elapsedSeconds;
  final int tasksCompleted;
  final int tasksTotal;
  final bool isDark;

  const _ExitConfirmDialog({
    required this.sessionId,
    required this.learnerName,
    required this.elapsedSeconds,
    required this.tasksCompleted,
    required this.tasksTotal,
    required this.isDark,
  });

  @override
  State<_ExitConfirmDialog> createState() => _ExitConfirmDialogState();
}

class _ExitConfirmDialogState extends State<_ExitConfirmDialog> {
  String _selectedReason = 'Session completed for today';
  bool _isSending = false;

  static const _reasons = [
    'Session completed for today',
    'Learner needs a break',
    'Scheduled class is ending',
    'Technical issue',
    'Learner is unwell',
    'Parent/guardian request',
    'Other',
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    final bgColor = isDark ? AppColors.darkSurface : Colors.white;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textMuted = isDark ? AppColors.textMutedDark : AppColors.textMutedLight;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final minutes = widget.elapsedSeconds ~/ 60;

    return Dialog(
      backgroundColor: bgColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        width: 420,
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.power_settings_new_rounded,
                      color: AppColors.error, size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'End Learning Session?',
                        style: AppTypography.titleMedium(isDark: isDark)
                            .copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Your mentor & parent will be notified.',
                        style: AppTypography.caption(isDark: isDark)
                            .copyWith(color: textMuted),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // Session summary
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkBackground : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: borderColor),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _stat(Icons.person_rounded, widget.learnerName, isDark, textMuted),
                  Container(width: 1, height: 20, color: borderColor),
                  _stat(Icons.timer_rounded, '$minutes min', isDark, textMuted),
                  Container(width: 1, height: 20, color: borderColor),
                  _stat(Icons.task_alt_rounded,
                      '${widget.tasksCompleted}/${widget.tasksTotal} tasks', isDark, textMuted),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Reason label
            Text(
              'Reason for ending session',
              style: AppTypography.labelMedium(isDark: isDark)
                  .copyWith(fontWeight: FontWeight.w600, color: textPrimary),
            ),
            const SizedBox(height: 8),

            // Reason dropdown
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
              decoration: BoxDecoration(
                  border: Border.all(color: borderColor),
                  borderRadius: BorderRadius.circular(10)),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedReason,
                  isExpanded: true,
                  dropdownColor: bgColor,
                  style: AppTypography.bodyMedium(isDark: isDark),
                  icon: Icon(Icons.expand_more_rounded, color: textMuted),
                  items: _reasons
                      .map((r) => DropdownMenuItem(
                            value: r,
                            child: Text(r, style: AppTypography.bodyMedium(isDark: isDark)),
                          ))
                      .toList(),
                  onChanged: (v) => setState(() => _selectedReason = v ?? _selectedReason),
                ),
              ),
            ),

            const SizedBox(height: 10),

            // Notification warning
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.warning.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.notifications_active_rounded,
                      color: AppColors.warning, size: 14),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Mentor and parent will receive an instant alert.',
                      style: AppTypography.caption(isDark: isDark)
                          .copyWith(color: AppColors.warning),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isSending ? null : () => Navigator.of(context).pop(),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: borderColor),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                    child: Text('Keep Learning',
                        style: AppTypography.labelMedium(isDark: isDark)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _isSending ? null : _confirmExit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.error,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: _isSending
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.logout_rounded, size: 18),
                    label: Text(
                      _isSending ? 'Notifying...' : 'End & Exit',
                      style: AppTypography.labelMedium(isDark: true).copyWith(
                          color: Colors.white, fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmExit() async {
    setState(() => _isSending = true);
    await AppExitService.exitAndNotify(
      sessionId: widget.sessionId,
      reason: _selectedReason,
      elapsedSeconds: widget.elapsedSeconds,
      tasksCompleted: widget.tasksCompleted,
      tasksTotal: widget.tasksTotal,
    );
    // App closes here — dialog does not need to pop
  }

  Widget _stat(IconData icon, String label, bool isDark, Color mutedColor) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: mutedColor),
        const SizedBox(width: 5),
        Text(label,
            style: AppTypography.caption(isDark: isDark)
                .copyWith(fontWeight: FontWeight.w600)),
      ],
    );
  }
}
