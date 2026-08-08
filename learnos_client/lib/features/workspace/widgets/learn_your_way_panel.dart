import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../providers/session_provider.dart';

class LearnYourWayPanel extends ConsumerStatefulWidget {
  const LearnYourWayPanel({super.key});

  @override
  ConsumerState<LearnYourWayPanel> createState() => _LearnYourWayPanelState();
}

class _LearnYourWayPanelState extends ConsumerState<LearnYourWayPanel> {
  final TextEditingController _conceptController = TextEditingController();

  final List<Map<String, String>> _modes = [
    {'id': 'eli5', 'label': '👶 ELI5 (5yo Analogy)', 'desc': 'Simple toys & snacks analogy'},
    {'id': 'step_by_step', 'label': '📐 Step-by-Step', 'desc': 'Visual logic breakdown'},
    {'id': 'real_world', 'label': '🍕 Real World Story', 'desc': 'Everyday scenario'},
    {'id': 'deep_dive', 'label': '🔬 Deep Dive', 'desc': 'Mathematical theory & proofs'},
  ];

  final List<String> _quickConcepts = [
    'Equivalent Fractions',
    'Numerator & Denominator',
    'Simplifying Fractions',
    'Cross Multiplication',
  ];

  @override
  void initState() {
    super.initState();
    final currentConcept = ref.read(sessionProvider).activeConcept;
    _conceptController.text = currentConcept;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final state = ref.read(sessionProvider);
      if (state.currentExplanation == null) {
        ref.read(sessionProvider.notifier).generateExplanation(state.activeConcept);
      }
    });
  }

  @override
  void dispose() {
    _conceptController.dispose();
    super.dispose();
  }

  void _onSearchSubmitted() {
    final query = _conceptController.text.trim();
    if (query.isNotEmpty) {
      ref.read(sessionProvider.notifier).generateExplanation(query);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final sessionState = ref.watch(sessionProvider);
    final explanation = sessionState.currentExplanation;
    final isGenerating = sessionState.isGeneratingExplanation;

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
            // 1. Header Banner
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
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.accentCyan.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.psychology, color: AppColors.accentCyan, size: 28),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              'Google Learn Your Way',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: textPrimary,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppColors.accentCyan,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text(
                                'Real-Time Adaptive AI',
                                style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'On-the-go explanations generated dynamically to match your cognitive speed, grade level, and comprehension style.',
                          style: TextStyle(fontSize: 12, color: textMuted),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // 2. Concept Search Input & Suggestion Chips
            Card(
              elevation: 0,
              color: cardBg,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: borderColor),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'What concept do you want explained on the go?',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: textPrimary),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _conceptController,
                            onSubmitted: (_) => _onSearchSubmitted(),
                            decoration: InputDecoration(
                              hintText: 'e.g., Equivalent Fractions, Denominator...',
                              hintStyle: TextStyle(color: textMuted, fontSize: 13),
                              filled: true,
                              fillColor: isDark ? AppColors.darkSurfaceElevated : AppColors.lightBackground,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: BorderSide(color: borderColor),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: BorderSide(color: borderColor),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        ElevatedButton.icon(
                          onPressed: isGenerating ? null : _onSearchSubmitted,
                          icon: const Icon(Icons.bolt, size: 18),
                          label: const Text('Explain Now'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _quickConcepts.map((c) {
                        final selected = sessionState.activeConcept == c;
                        return ChoiceChip(
                          label: Text(c, style: TextStyle(fontSize: 11, color: selected ? Colors.white : textPrimary)),
                          selected: selected,
                          selectedColor: AppColors.accentCyan,
                          backgroundColor: isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated,
                          onSelected: (_) {
                            _conceptController.text = c;
                            ref.read(sessionProvider.notifier).generateExplanation(c);
                          },
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // 3. Explanation Mode Selector Pills
            Row(
              children: [
                Text(
                  'Select Explanation Style:',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textPrimary),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: _modes.map((m) {
                        final isSelected = sessionState.explanationStyle == m['id'];
                        return Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: FilterChip(
                            label: Text(m['label']!),
                            selected: isSelected,
                            selectedColor: AppColors.accentCyan.withOpacity(0.2),
                            checkmarkColor: AppColors.accentCyan,
                            labelStyle: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              color: isSelected ? AppColors.accentCyan : textPrimary,
                            ),
                            backgroundColor: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                              side: BorderSide(
                                color: isSelected ? AppColors.accentCyan : borderColor,
                              ),
                            ),
                            onSelected: (_) {
                              ref.read(sessionProvider.notifier).setExplanationStyle(m['id']!);
                            },
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // 4. Adaptation Tuning Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurfaceElevated : AppColors.pastelMint,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isDark ? AppColors.darkBorder : AppColors.pastelMintText.withOpacity(0.2),
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.tune, size: 16, color: AppColors.pastelMintText),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Tuned to student capability: ${explanation?['adapted_for'] ?? '${sessionState.learnerName} • ${sessionState.grade} (${sessionState.masteryLevel.toUpperCase()}) • ${sessionState.explanationStyle.toUpperCase()}'}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.pastelMintText,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // 5. Dynamic Explanation Content Box
            Card(
              elevation: 0,
              color: cardBg,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: borderColor),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: isGenerating
                    ? const Padding(
                        padding: EdgeInsets.all(40.0),
                        child: Center(
                          child: Column(
                            children: [
                              CircularProgressIndicator(color: AppColors.accentCyan),
                              SizedBox(height: 16),
                              Text(
                                'Gemini AI is generating your personalized explanation on the go...',
                                style: TextStyle(fontSize: 12, color: AppColors.textMutedLight),
                              ),
                            ],
                          ),
                        ),
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.lightbulb_outline, color: AppColors.warning, size: 20),
                                  const SizedBox(width: 8),
                                  Text(
                                    explanation?['concept'] ?? sessionState.activeConcept,
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.accentCyan.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  'Style: ${(explanation?['style'] ?? sessionState.explanationStyle).toUpperCase()}',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.accentCyan,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const Divider(height: 24),

                          // Explanation Body
                          Text(
                            explanation?['explanation'] ?? 'Select a concept above to generate your explanation.',
                            style: TextStyle(
                              fontSize: 14,
                              height: 1.6,
                              color: textPrimary,
                            ),
                          ),

                          const SizedBox(height: 20),

                          // Key Takeaways
                          if (explanation?['key_takeaways'] != null) ...[
                            Text(
                              'Key Takeaways for Students:',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textMuted),
                            ),
                            const SizedBox(height: 8),
                            ...List<dynamic>.from(explanation!['key_takeaways']).map((takeaway) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 6.0),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Icon(Icons.check_circle, color: AppColors.success, size: 16),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        takeaway.toString(),
                                        style: TextStyle(fontSize: 12, color: textPrimary),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }),
                            const SizedBox(height: 16),
                          ],

                          // Quick Understanding Check Card
                          if (explanation?['quick_check_question'] != null) ...[
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: isDark ? AppColors.darkSurfaceElevated : AppColors.pastelPeach,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isDark ? AppColors.darkBorder : AppColors.pastelPeachText.withOpacity(0.2),
                                ),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.help_outline, color: AppColors.pastelPeachText, size: 20),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          'Quick Check Question',
                                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.pastelPeachText),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          explanation!['quick_check_question'].toString(),
                                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textPrimary),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  OutlinedButton(
                                    onPressed: () {
                                      ref.read(sessionProvider.notifier).sendAiMessage(
                                        'Can you help me solve this check question: "${explanation['quick_check_question']}"?',
                                      );
                                      ref.read(sessionProvider.notifier).setNavTab('workspace');
                                    },
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: AppColors.pastelPeachText,
                                      side: const BorderSide(color: AppColors.pastelPeachText),
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    ),
                                    child: const Text('Discuss with AI', style: TextStyle(fontSize: 11)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
