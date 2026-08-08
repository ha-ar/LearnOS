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
            // 1. Student Capability Header Card
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
                          '${sessionState.grade} • ${sessionState.subject} • Topic: ${sessionState.topic}',
                          style: TextStyle(fontSize: 12, color: textMuted),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.success.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.success.withOpacity(0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.verified, size: 14, color: AppColors.success),
                        const SizedBox(width: 6),
                        Text(
                          'Mastery: ${sessionState.masteryLevel.toUpperCase()}',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: AppColors.success,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // 2. Adaptive Learning Controls Grid
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Left Column: Mastery & Pacing Settings
                Expanded(
                  child: Card(
                    elevation: 0,
                    color: cardBg,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(color: borderColor),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.speed, color: AppColors.accentCyan, size: 20),
                              const SizedBox(width: 8),
                              Text(
                                'Capability & Pacing Controls',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: textPrimary),
                              ),
                            ],
                          ),
                          const Divider(height: 24),

                          // Target Mastery Level Selector
                          Text(
                            'Current Mastery Level',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textMuted),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: ['emerging', 'developing', 'mastered'].map((lvl) {
                              final isSelected = sessionState.masteryLevel.toLowerCase() == lvl;
                              return Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.only(right: 6.0),
                                  child: ChoiceChip(
                                    label: Center(
                                      child: Text(
                                        lvl.toUpperCase(),
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                          color: isSelected ? Colors.white : textPrimary,
                                        ),
                                      ),
                                    ),
                                    selected: isSelected,
                                    selectedColor: AppColors.primary,
                                    backgroundColor: isDark ? AppColors.darkSurfaceElevated : AppColors.lightBackground,
                                    onSelected: (_) {
                                      ref.read(sessionProvider.notifier).updateMasteryLevel(lvl);
                                    },
                                  ),
                                ),
                              );
                            }).toList(),
                          ),

                          const SizedBox(height: 20),

                          // Pacing Speed Controller
                          Text(
                            'Adaptation Pacing Speed',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textMuted),
                          ),
                          const SizedBox(height: 8),
                          Column(
                            children: [
                              'Gentle Pace (Extra Scaffolding)',
                              'Balanced Pace (Standard)',
                              'Accelerated Pace (Fast Track)',
                            ].map((speed) {
                              final speedName = speed.split(' (')[0];
                              return RadioListTile<String>(

                                value: speedName,
                                groupValue: sessionState.pacingSpeed,
                                title: Text(speed, style: TextStyle(fontSize: 12, color: textPrimary)),
                                activeColor: AppColors.accentCyan,
                                dense: true,
                                contentPadding: EdgeInsets.zero,
                                onChanged: (val) {
                                  if (val != null) {
                                    ref.read(sessionProvider.notifier).setPacingSpeed(val);
                                  }
                                },
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                const SizedBox(width: 16),

                // Right Column: Skill Breakdown Matrix
                Expanded(
                  child: Card(
                    elevation: 0,
                    color: cardBg,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(color: borderColor),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.bar_chart, color: AppColors.pastelLavenderText, size: 20),
                              const SizedBox(width: 8),
                              Text(
                                'Sub-Skill Capability Breakdown',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: textPrimary),
                              ),
                            ],
                          ),
                          const Divider(height: 24),

                          _buildSkillProgress(
                            'Fractional Concept Visuals',
                            0.85,
                            '85% Mastery',
                            AppColors.success,
                            textPrimary,
                            textMuted,
                          ),
                          const SizedBox(height: 14),
                          _buildSkillProgress(
                            'Equivalent Ratio Logic',
                            0.60,
                            '60% Mastery',
                            AppColors.warning,
                            textPrimary,
                            textMuted,
                          ),
                          const SizedBox(height: 14),
                          _buildSkillProgress(
                            'Denominator Multiplication',
                            0.42,
                            '42% (Needs Support)',
                            AppColors.error,
                            textPrimary,
                            textMuted,
                          ),
                          const SizedBox(height: 14),
                          _buildSkillProgress(
                            'Word Problem Transfer',
                            0.70,
                            '70% Mastery',
                            AppColors.accentCyan,
                            textPrimary,
                            textMuted,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // 3. AI Socratic Companion Capabilities Info Card
            Card(
              elevation: 0,
              color: isDark ? AppColors.darkSurfaceElevated : AppColors.pastelBlue,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(
                  color: isDark ? AppColors.darkBorder : AppColors.pastelBlueText.withOpacity(0.2),
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(18.0),
                child: Row(
                  children: [
                    const Icon(Icons.auto_awesome, color: AppColors.pastelBlueText, size: 24),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Personalized AI Learning Adaptation Active',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: AppColors.pastelBlueText,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'The Socratic Companion automatically adjusts prompt complexity, hint levels, and question scaffolding based on ${sessionState.learnerName}\'s capability responses.',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSkillProgress(
    String skillName,
    double percent,
    String label,
    Color color,
    Color textPrimary,
    Color textMuted,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(skillName, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textPrimary)),
            Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: percent,
            minHeight: 8,
            backgroundColor: color.withOpacity(0.12),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}
