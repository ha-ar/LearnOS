import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../providers/session_provider.dart';

class StudentCapabilityWidget extends ConsumerWidget {
  const StudentCapabilityWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final sessionState = ref.watch(sessionProvider);

    final cardBg = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textMuted = isDark ? AppColors.textMutedDark : AppColors.textMutedLight;

    return Container(
      color: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Student Profile Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: isDark
                    ? const LinearGradient(colors: [Color(0xFF1E293B), Color(0xFF0F172A)])
                    : AppColors.heroGradientLight,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: borderColor),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: AppColors.accentCyan.withOpacity(0.2),
                    child: Text(
                      sessionState.learnerName.isNotEmpty ? sessionState.learnerName[0] : 'S',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppColors.accentCyan,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          sessionState.learnerName,
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${sessionState.grade} • International Baccalaureate (IB) • ${sessionState.subject}',
                          style: TextStyle(fontSize: 12, color: textMuted),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.accentCyan.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.accentCyan.withOpacity(0.3)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.visibility_outlined, size: 14, color: AppColors.accentCyan),
                        SizedBox(width: 6),
                        Text(
                          'Learner View Only',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: AppColors.accentCyan,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // 2. Mentor & Guardian Governance Notice Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E1B4B) : const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? const Color(0xFF6366F1).withOpacity(0.3) : const Color(0xFFBFDBFE),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.shield_outlined, color: Color(0xFF3B82F6), size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Governance & Capability Assessment Authority',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF3B82F6),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Student capabilities, cognitive preferences, and baseline metrics are assigned and evaluated by your mentor (Ms. Nadia) and guardian (Mr. Ali). Unassessed dimensions remain N/A until formal evaluation.',
                          style: TextStyle(
                            fontSize: 12,
                            height: 1.5,
                            color: isDark ? AppColors.textPrimaryDark : const Color(0xFF1E3A8A),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            Text(
              'Assessed Capability Dimensions',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Below are the verified learning and cognitive dimensions recorded in your digital twin.',
              style: TextStyle(fontSize: 12, color: textMuted),
            ),

            const SizedBox(height: 16),

            // 3. Capability Dimensions Grid
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _buildCapabilityCard(
                    title: 'Pacing & Cognitive Speed',
                    icon: Icons.speed,
                    value: sessionState.pacingSpeed,
                    statusText: 'Active Mentor Setting',
                    statusColor: AppColors.accentCyan,
                    description: 'Determines the speed and breakdown detail of interactive lesson explanations.',
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                    textMuted: textMuted,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildCapabilityCard(
                    title: 'Target Concept Mastery',
                    icon: Icons.military_tech_outlined,
                    value: sessionState.masteryLevel.toUpperCase(),
                    statusText: 'Assessed on ${sessionState.topic}',
                    statusColor: AppColors.success,
                    description: 'Current verified understanding benchmark across curriculum competencies.',
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                    textMuted: textMuted,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _buildCapabilityCard(
                    title: 'Math Reasoning Comfort',
                    icon: Icons.calculate_outlined,
                    value: 'N/A',
                    statusText: 'Pending Mentor Evaluation',
                    statusColor: const Color(0xFFF59E0B),
                    description: 'Quantitative problem solving comfort index. Will be updated after module check.',
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                    textMuted: textMuted,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildCapabilityCard(
                    title: 'Self-Regulation & Reflection Span',
                    icon: Icons.psychology_outlined,
                    value: 'N/A',
                    statusText: 'Pending Mentor Evaluation',
                    statusColor: const Color(0xFFF59E0B),
                    description: 'Metacognitive feedback rating based on reflection step responses.',
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                    textMuted: textMuted,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // 4. Request Mentor Review Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: borderColor),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.mark_chat_unread_outlined, color: AppColors.primary, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Have questions about your capabilities?',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'You can request a capability review or pacing adjustment with Ms. Nadia at any time.',
                          style: TextStyle(fontSize: 12, color: textMuted),
                        ),
                      ],
                    ),
                  ),
                  OutlinedButton.icon(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Capability review request sent to Ms. Nadia!'),
                          backgroundColor: AppColors.success,
                        ),
                      );
                    },
                    icon: const Icon(Icons.send_rounded, size: 14),
                    label: const Text('Request Review', style: TextStyle(fontSize: 12)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(color: AppColors.primary),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCapabilityCard({
    required String title,
    required IconData icon,
    required String value,
    required String statusText,
    required Color statusColor,
    required String description,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textMuted,
  }) {
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
              Icon(icon, size: 18, color: statusColor),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: textPrimary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: value == 'N/A' ? textMuted : textPrimary,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  statusText,
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: TextStyle(fontSize: 11, color: textMuted, height: 1.4),
          ),
        ],
      ),
    );
  }
}
