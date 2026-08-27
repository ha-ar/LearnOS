import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/twin_api_service.dart';
import '../providers/session_provider.dart';

class CoursesProgressPanel extends ConsumerStatefulWidget {
  const CoursesProgressPanel({super.key});

  @override
  ConsumerState<CoursesProgressPanel> createState() => _CoursesProgressPanelState();
}

class _CoursesProgressPanelState extends ConsumerState<CoursesProgressPanel> {
  Map<String, dynamic>? _progressData;
  bool _isLoading = true;
  String? _selectedSubject;

  @override
  void initState() {
    super.initState();
    _loadCourseProgress();
  }

  Future<void> _loadCourseProgress() async {
    final session = ref.read(sessionProvider);
    setState(() => _isLoading = true);

    final data = await TwinApiService.getCourseProgress(session.learnerId);
    if (mounted) {
      setState(() {
        _progressData = data;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final session = ref.watch(sessionProvider);

    final cardBg = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textMuted = isDark ? AppColors.textMutedDark : AppColors.textMutedLight;

    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.accentCyan),
      );
    }

    final courses = (_progressData?['courses'] as List<dynamic>?) ?? _fallbackCourses(session.grade);
    final overallPct = _progressData?['overall_progress_percent'] ?? 28;
    final totalTopics = _progressData?['total_curriculum_topics'] ?? 140;
    final completedTopics = _progressData?['total_completed_topics'] ?? 39;
    final curriculumName = _progressData?['curriculum_name'] ?? 'International Baccalaureate';

    return Container(
      color: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Overall Progress Hero Banner
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                gradient: isDark
                    ? const LinearGradient(
                        colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : AppColors.heroGradientLight,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: borderColor),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(isDark ? 0.3 : 0.05),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Circular Progress Indicator
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox(
                        width: 72,
                        height: 72,
                        child: CircularProgressIndicator(
                          value: (overallPct as num).toDouble() / 100.0,
                          strokeWidth: 8,
                          backgroundColor: isDark ? Colors.white12 : Colors.black12,
                          color: AppColors.accentCyan,
                        ),
                      ),
                      Text(
                        '$overallPct%',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: textPrimary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppColors.accentCyan.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                curriculumName.toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.accentCyan,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              session.grade,
                              style: TextStyle(fontSize: 12, color: textMuted, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${session.learnerName}’s Learning Journey',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'You have completed $completedTopics of $totalTopics total curriculum topics so far. Keep going!',
                          style: TextStyle(fontSize: 13, color: textMuted, height: 1.4),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            Text(
              'Enrolled Courses & Next Steps',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: textPrimary,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Select any course to view all syllabus topics, covered milestones, and upcoming lessons.',
              style: TextStyle(fontSize: 13, color: textMuted),
            ),

            const SizedBox(height: 16),

            // 2. Course Cards List / Grid
            ...courses.map((c) => _buildCourseCard(context, c, isDark, cardBg, borderColor, textPrimary, textMuted)),
          ],
        ),
      ),
    );
  }

  Widget _buildCourseCard(
    BuildContext context,
    dynamic course,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textMuted,
  ) {
    final subject = course['subject'] ?? 'Subject';
    final total = course['total_topics'] ?? 30;
    final completed = course['completed_topics'] ?? 0;
    final inProgress = course['in_progress_topics'] ?? 0;
    final pct = course['progress_percent'] ?? 0;
    final nextTopic = course['next_topic'] ?? 'Introduction';
    final allTopics = (course['all_topics'] as List<dynamic>?) ?? [];

    final isExpanded = _selectedSubject == subject;

    final (subjectIcon, subjectColor) = _getSubjectMeta(subject);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isExpanded ? subjectColor.withOpacity(0.5) : borderColor),
      ),
      child: Column(
        children: [
          // Main Course Summary Row
          InkWell(
            onTap: () {
              setState(() {
                _selectedSubject = isExpanded ? null : subject;
              });
            },
            borderRadius: BorderRadius.circular(14),
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: subjectColor.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(subjectIcon, color: subjectColor, size: 22),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              subject,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: textPrimary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '$completed of $total topics completed ($pct%)',
                              style: TextStyle(fontSize: 12, color: textMuted),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: subjectColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '$pct%',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: subjectColor,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                        color: textMuted,
                        size: 20,
                      ),
                    ],
                  ),

                  const SizedBox(height: 14),

                  // Progress Bar
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: total > 0 ? (completed / total).clamp(0.0, 1.0) : 0.0,
                      minHeight: 6,
                      backgroundColor: isDark ? Colors.white10 : Colors.black12,
                      color: subjectColor,
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Next Topic Callout Banner
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.black26 : Colors.white60,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: borderColor.withOpacity(0.6)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.flag_outlined, size: 16, color: subjectColor),
                        const SizedBox(width: 8),
                        Text(
                          'Next Up: ',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textPrimary),
                        ),
                        Expanded(
                          child: Text(
                            nextTopic,
                            style: TextStyle(fontSize: 12, color: subjectColor, fontWeight: FontWeight.w600),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Expanded Topics List
          if (isExpanded) ...[
            const Divider(height: 1),
            Container(
              padding: const EdgeInsets.all(16),
              color: isDark ? Colors.black12 : const Color(0xFFF8FAFC),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Full Curriculum Syllabus (${allTopics.length} Topics)',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: textPrimary,
                    ),
                  ),
                  const SizedBox(height: 10),
                  ...allTopics.take(15).map((t) {
                    final status = t['status'] ?? 'upcoming';
                    final title = t['topic'] ?? 'Topic';
                    final order = t['order'] ?? 1;

                    Color statusColor = textMuted;
                    IconData statusIcon = Icons.circle_outlined;
                    String statusLabel = 'Upcoming';

                    if (status == 'completed') {
                      statusColor = AppColors.success;
                      statusIcon = Icons.check_circle_rounded;
                      statusLabel = 'Completed';
                    } else if (status == 'in_progress') {
                      statusColor = AppColors.accentCyan;
                      statusIcon = Icons.play_circle_filled_rounded;
                      statusLabel = 'In Progress';
                    }

                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(
                        children: [
                          Container(
                            width: 24,
                            alignment: Alignment.center,
                            child: Text(
                              '$order.',
                              style: TextStyle(fontSize: 11, color: textMuted, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              title,
                              style: TextStyle(
                                fontSize: 13,
                                color: textPrimary,
                                fontWeight: status == 'in_progress' ? FontWeight.bold : FontWeight.normal,
                              ),
                            ),
                          ),
                          Icon(statusIcon, size: 16, color: statusColor),
                          const SizedBox(width: 6),
                          Text(
                            statusLabel,
                            style: TextStyle(fontSize: 11, color: statusColor, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    );
                  }),
                  if (allTopics.length > 15) ...[
                    const SizedBox(height: 6),
                    Text(
                      '+ ${allTopics.length - 15} more topics in this course',
                      style: TextStyle(fontSize: 11, color: textMuted, fontStyle: FontStyle.italic),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  (IconData, Color) _getSubjectMeta(String subject) {
    final s = subject.toLowerCase();
    if (s.contains('math')) {
      return (Icons.calculate_outlined, const Color(0xFF3B82F6));
    } else if (s.contains('science')) {
      return (Icons.science_outlined, const Color(0xFF10B981));
    } else if (s.contains('computer') || s.contains('code') || s.contains('tech')) {
      return (Icons.terminal_outlined, const Color(0xFF8B5CF6));
    } else if (s.contains('english') || s.contains('language') || s.contains('lit')) {
      return (Icons.menu_book_outlined, const Color(0xFFF59E0B));
    }
    return (Icons.school_outlined, AppColors.accentCyan);
  }

  List<Map<String, dynamic>> _fallbackCourses(String grade) {
    return [
      {
        'subject': 'Mathematics',
        'curriculum_name': 'International Baccalaureate',
        'grade': grade,
        'total_topics': 38,
        'completed_topics': 14,
        'in_progress_topics': 2,
        'progress_percent': 37,
        'next_topic': 'Basic Algebra & Equations',
        'all_topics': [
          {'topic': 'Basic Fractions', 'order': 1, 'status': 'completed'},
          {'topic': 'Equivalent Fractions', 'order': 2, 'status': 'completed'},
          {'topic': 'Adding Fractions', 'order': 3, 'status': 'completed'},
          {'topic': 'Basic Algebra & Equations', 'order': 4, 'status': 'in_progress'},
          {'topic': 'Linear Equations with Variables', 'order': 5, 'status': 'upcoming'},
          {'topic': 'Ratios and Proportions', 'order': 6, 'status': 'upcoming'},
        ],
      },
      {
        'subject': 'Science',
        'curriculum_name': 'International Baccalaureate',
        'grade': grade,
        'total_topics': 35,
        'completed_topics': 10,
        'in_progress_topics': 1,
        'progress_percent': 29,
        'next_topic': 'Cell Biology & Microorganisms',
        'all_topics': [
          {'topic': 'Scientific Method & Observation', 'order': 1, 'status': 'completed'},
          {'topic': 'States of Matter', 'order': 2, 'status': 'completed'},
          {'topic': 'Cell Biology & Microorganisms', 'order': 3, 'status': 'in_progress'},
          {'topic': 'Ecosystems & Energy Flow', 'order': 4, 'status': 'upcoming'},
        ],
      },
      {
        'subject': 'Computer Science',
        'curriculum_name': 'International Baccalaureate',
        'grade': grade,
        'total_topics': 30,
        'completed_topics': 8,
        'in_progress_topics': 1,
        'progress_percent': 27,
        'next_topic': 'Algorithms & Flowcharts',
        'all_topics': [
          {'topic': 'Digital Literacy & Safety', 'order': 1, 'status': 'completed'},
          {'topic': 'Hardware vs Software', 'order': 2, 'status': 'completed'},
          {'topic': 'Algorithms & Flowcharts', 'order': 3, 'status': 'in_progress'},
          {'topic': 'Variables & Data Types', 'order': 4, 'status': 'upcoming'},
        ],
      },
      {
        'subject': 'English',
        'curriculum_name': 'International Baccalaureate',
        'grade': grade,
        'total_topics': 37,
        'completed_topics': 7,
        'in_progress_topics': 1,
        'progress_percent': 19,
        'next_topic': 'Narrative Writing & Story Structure',
        'all_topics': [
          {'topic': 'Reading Comprehension Strategies', 'order': 1, 'status': 'completed'},
          {'topic': 'Grammar: Complex Sentences', 'order': 2, 'status': 'completed'},
          {'topic': 'Narrative Writing & Story Structure', 'order': 3, 'status': 'in_progress'},
          {'topic': 'Figurative Language & Metaphors', 'order': 4, 'status': 'upcoming'},
        ],
      },
    ];
  }
}
