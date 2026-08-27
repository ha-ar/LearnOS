import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/ai_api_service.dart';
import '../providers/session_provider.dart';

class VideoLessonPlayer extends ConsumerStatefulWidget {
  final VoidCallback? onVideoCompleted;

  const VideoLessonPlayer({super.key, this.onVideoCompleted});

  @override
  ConsumerState<VideoLessonPlayer> createState() => _VideoLessonPlayerState();
}

class _VideoLessonPlayerState extends ConsumerState<VideoLessonPlayer> {
  bool _isPlaying = false;
  double _progress = 0.35;
  bool _isGeneratingAiVideo = false;
  Map<String, dynamic>? _aiVisualLesson;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final session = ref.watch(sessionProvider);

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
            // 1. Header & Source Badge
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF0000).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: const Color(0xFFFF0000).withValues(alpha: 0.3)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.play_arrow_rounded, color: Color(0xFFFF0000), size: 16),
                      SizedBox(width: 4),
                      Text(
                        'Video Lesson',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFFF0000)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  '${session.subject} • ${session.grade}',
                  style: TextStyle(fontSize: 12, color: textMuted, fontWeight: FontWeight.w600),
                ),
                const Spacer(),
                OutlinedButton.icon(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Opening YouTube search for: ${session.subject} ${session.topic}'),
                        backgroundColor: AppColors.accentCyan,
                      ),
                    );
                  },
                  icon: const Icon(Icons.open_in_new, size: 14),
                  label: const Text('Open on YouTube', style: TextStyle(fontSize: 12)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: textPrimary,
                    side: BorderSide(color: borderColor),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            Text(
              'Visual Concept Breakdown: ${session.topic}',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: textPrimary,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Watch the curated lesson below or generate an AI-powered visual explainer adapted for you.',
              style: TextStyle(fontSize: 13, color: textMuted),
            ),

            const SizedBox(height: 16),

            // 2. Video Player Frame
            Container(
              height: 380,
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: borderColor),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.5 : 0.15),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Stack(
                  children: [
                    // Video Visual
                    Positioned.fill(
                      child: Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Color(0xFF0F172A),
                              Color(0xFF1E293B),
                              Color(0xFF0F172A),
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                        ),
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 72,
                                height: 72,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: AppColors.accentCyan.withValues(alpha: 0.9),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.accentCyan.withValues(alpha: 0.4),
                                      blurRadius: 20,
                                      spreadRadius: 4,
                                    ),
                                  ],
                                ),
                                child: IconButton(
                                  icon: Icon(
                                    _isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                                    size: 40,
                                    color: Colors.black,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _isPlaying = !_isPlaying;
                                      if (_isPlaying && _progress < 0.9) {
                                        _progress = 0.75;
                                      }
                                    });
                                  },
                                ),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                '${session.topic} — Full Animated Guide',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Curated from YouTube Education • 6 mins 30 secs',
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.7),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                    // Video Controls Overlay (Bottom)
                    Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Colors.transparent, Colors.black.withValues(alpha: 0.85)],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                          ),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Scrubber
                            SliderTheme(
                              data: SliderTheme.of(context).copyWith(
                                trackHeight: 4,
                                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                                activeTrackColor: AppColors.accentCyan,
                                inactiveTrackColor: Colors.white24,
                                thumbColor: AppColors.accentCyan,
                              ),
                              child: Slider(
                                value: _progress,
                                onChanged: (v) => setState(() => _progress = v),
                              ),
                            ),
                            Row(
                              children: [
                                IconButton(
                                  icon: Icon(
                                    _isPlaying ? Icons.pause : Icons.play_arrow,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                  onPressed: () => setState(() => _isPlaying = !_isPlaying),
                                ),
                                const SizedBox(width: 8),
                                const Text(
                                  '02:15 / 06:30',
                                  style: TextStyle(color: Colors.white, fontSize: 12),
                                ),
                                const Spacer(),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.white12,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: const Text('1080p HD', style: TextStyle(color: Colors.white, fontSize: 10)),
                                ),
                                const SizedBox(width: 8),
                                IconButton(
                                  icon: const Icon(Icons.fullscreen, color: Colors.white, size: 20),
                                  onPressed: () {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Fullscreen Mode')),
                                    );
                                  },
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // 3. AI Video & Visual Lesson Generator Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: borderColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF8B5CF6).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.auto_awesome, color: Color(0xFF8B5CF6), size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Generate AI Visual Lesson',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: textPrimary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Want a custom animated breakdown with step-by-step illustrations? Let AI generate it right now.',
                              style: TextStyle(fontSize: 12, color: textMuted),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton.icon(
                        onPressed: _isGeneratingAiVideo ? null : _generateAiVisualLesson,
                        icon: _isGeneratingAiVideo
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.bolt, size: 16),
                        label: Text(_isGeneratingAiVideo ? 'Generating...' : 'Generate with AI'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF8B5CF6),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ],
                  ),

                  // AI Visual Lesson Render Result
                  if (_aiVisualLesson != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E1B4B) : const Color(0xFFF5F3FF),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark ? const Color(0xFF8B5CF6).withValues(alpha: 0.3) : const Color(0xFFDDD6FE),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.video_collection_outlined, color: Color(0xFF8B5CF6), size: 16),
                              SizedBox(width: 6),
                              Text(
                                'AI Visual Storyboard Generated',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF8B5CF6),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            _aiVisualLesson!['explanation'] ?? '',
                            style: TextStyle(
                              fontSize: 14,
                              height: 1.6,
                              color: isDark ? AppColors.textPrimaryDark : const Color(0xFF4C1D95),
                            ),
                          ),
                          const SizedBox(height: 12),
                          ...((_aiVisualLesson!['key_takeaways'] as List<dynamic>?) ?? []).map(
                            (item) => Padding(
                              padding: const EdgeInsets.only(bottom: 6),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.check_circle, size: 14, color: Color(0xFF8B5CF6)),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      item.toString(),
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: isDark ? AppColors.textPrimaryDark : const Color(0xFF4C1D95),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 24),

            // 4. Mark Video Done & Continue CTA
            Center(
              child: ElevatedButton.icon(
                onPressed: () {
                  if (widget.onVideoCompleted != null) {
                    widget.onVideoCompleted!();
                  } else {
                    ref.read(sessionProvider.notifier).completeCurrentTask();
                  }
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Video completed! Advancing to the next step.'),
                      backgroundColor: AppColors.success,
                    ),
                  );
                },
                icon: const Icon(Icons.check_circle_outline, size: 18),
                label: const Text('I Finished the Video — Continue to Practice'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accentCyan,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _generateAiVisualLesson() async {
    final session = ref.read(sessionProvider);
    setState(() => _isGeneratingAiVideo = true);

    try {
      final res = await AiApiService.explainConcept(
        concept: session.topic,
        topic: session.topic,
        masteryLevel: session.masteryLevel,
        explanationStyle: 'step_by_step',
        pacingSpeed: 'Balanced Pace',
      );

      if (mounted) {
        setState(() {
          _aiVisualLesson = res;
          _isGeneratingAiVideo = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isGeneratingAiVideo = false);
      }
    }
  }
}

