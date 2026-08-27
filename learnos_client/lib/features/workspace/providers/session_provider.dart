import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/services/session_api_service.dart';
import '../../../data/services/event_api_service.dart';
import '../../../data/services/twin_api_service.dart';
import '../../../data/services/ai_api_service.dart';
import '../../auth/models/auth_user.dart';

// ---------------------------------------------------------------------------
// Enums & Models
// ---------------------------------------------------------------------------

enum TaskStatus { completed, active, upcoming }

enum EscalationStatus { idle, pending, resolved }

class SessionTask {
  final String id;
  final int order;
  final String type; // 'review' | 'learn' | 'practice' | 'reflect'
  final String title;
  final int durationMin;
  final TaskStatus status;
  final String? competencyId;
  final String? resourceId;
  final String? topic;
  final String? subject;

  const SessionTask({
    required this.id,
    required this.order,
    required this.type,
    required this.title,
    required this.durationMin,
    required this.status,
    this.competencyId,
    this.resourceId,
    this.topic,
    this.subject,
  });

  SessionTask copyWith({TaskStatus? status}) {
    return SessionTask(
      id: id,
      order: order,
      type: type,
      title: title,
      durationMin: durationMin,
      status: status ?? this.status,
      competencyId: competencyId,
      resourceId: resourceId,
      topic: topic,
      subject: subject,
    );
  }
}

class AiMessage {
  final String sender; // 'ai' | 'user'
  final String text;
  final String time;
  final bool isTyping;

  const AiMessage({
    required this.sender,
    required this.text,
    required this.time,
    this.isTyping = false,
  });
}

class SessionState {
  final String sessionId;
  final String learnerId;
  final String learnerName;
  final String tenantId;
  final String grade;
  final String subject;
  final String topic;
  final String competency;
  final String masteryLevel;
  final String goal;
  final List<SessionTask> tasks;
  final int activeTaskIndex;
  final int elapsedSeconds;
  final int totalDurationMin;
  final List<AiMessage> aiMessages;
  final EscalationStatus escalationStatus;
  final bool sessionStarted;
  final bool sessionComplete;
  final bool isLoading;
  final String? errorMessage;
  final String activeNavTab; // 'workspace' | 'learnYourWay' | 'capabilities' | 'practice' | 'progress'
  final String explanationStyle; // 'eli5' | 'step_by_step' | 'real_world' | 'deep_dive'
  final String pacingSpeed; // 'Gentle Pace' | 'Balanced Pace' | 'Accelerated Pace'
  final String activeConcept;
  final Map<String, dynamic>? currentExplanation;
  final bool isGeneratingExplanation;

  const SessionState({
    required this.sessionId,
    required this.learnerId,
    required this.learnerName,
    required this.tenantId,
    required this.grade,
    required this.subject,
    required this.topic,
    required this.competency,
    required this.masteryLevel,
    required this.goal,
    required this.tasks,
    required this.activeTaskIndex,
    required this.elapsedSeconds,
    required this.totalDurationMin,
    required this.aiMessages,
    required this.escalationStatus,
    required this.sessionStarted,
    required this.sessionComplete,
    this.isLoading = false,
    this.errorMessage,
    this.activeNavTab = 'workspace',
    this.explanationStyle = 'real_world',
    this.pacingSpeed = 'Balanced Pace',
    this.activeConcept = 'Equivalent Fractions',
    this.currentExplanation,
    this.isGeneratingExplanation = false,
  });


  SessionTask? get activeTask =>
      activeTaskIndex < tasks.length ? tasks[activeTaskIndex] : null;

  /// Competency ID from the active task (may be null for reflect/general tasks)
  String? get competencyId => activeTask?.competencyId;

  int get remainingSeconds =>
      (totalDurationMin * 60) - elapsedSeconds;

  String get formattedElapsed {
    final m = (elapsedSeconds ~/ 60).toString().padLeft(2, '0');
    final s = (elapsedSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  String get formattedRemaining {
    final secs = remainingSeconds.clamp(0, totalDurationMin * 60);
    final m = (secs ~/ 60).toString();
    return '${m}m left';
  }

  SessionState copyWith({
    String? sessionId,
    String? learnerId,
    String? learnerName,
    String? tenantId,
    String? grade,
    String? subject,
    String? topic,
    String? competency,
    String? masteryLevel,
    String? goal,
    List<SessionTask>? tasks,
    int? activeTaskIndex,
    int? elapsedSeconds,
    int? totalDurationMin,
    List<AiMessage>? aiMessages,
    EscalationStatus? escalationStatus,
    bool? sessionStarted,
    bool? sessionComplete,
    bool? isLoading,
    String? errorMessage,
    String? activeNavTab,
    String? explanationStyle,
    String? pacingSpeed,
    String? activeConcept,
    Map<String, dynamic>? currentExplanation,
    bool? isGeneratingExplanation,
  }) {
    return SessionState(
      sessionId: sessionId ?? this.sessionId,
      learnerId: learnerId ?? this.learnerId,
      learnerName: learnerName ?? this.learnerName,
      tenantId: tenantId ?? this.tenantId,
      grade: grade ?? this.grade,
      subject: subject ?? this.subject,
      topic: topic ?? this.topic,
      competency: competency ?? this.competency,
      masteryLevel: masteryLevel ?? this.masteryLevel,
      goal: goal ?? this.goal,
      tasks: tasks ?? this.tasks,
      activeTaskIndex: activeTaskIndex ?? this.activeTaskIndex,
      elapsedSeconds: elapsedSeconds ?? this.elapsedSeconds,
      totalDurationMin: totalDurationMin ?? this.totalDurationMin,
      aiMessages: aiMessages ?? this.aiMessages,
      escalationStatus: escalationStatus ?? this.escalationStatus,
      sessionStarted: sessionStarted ?? this.sessionStarted,
      sessionComplete: sessionComplete ?? this.sessionComplete,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      activeNavTab: activeNavTab ?? this.activeNavTab,
      explanationStyle: explanationStyle ?? this.explanationStyle,
      pacingSpeed: pacingSpeed ?? this.pacingSpeed,
      activeConcept: activeConcept ?? this.activeConcept,
      currentExplanation: currentExplanation ?? this.currentExplanation,
      isGeneratingExplanation: isGeneratingExplanation ?? this.isGeneratingExplanation,
    );
  }


  static SessionState initial() {
    return const SessionState(
      sessionId: 'sess-001',
      learnerId: '10000000-0000-0000-0000-000000000001',
      learnerName: 'Ahmed Khan',
      tenantId: '00000000-0000-0000-0000-000000000001',
      grade: 'Grade 6',
      subject: 'Mathematics',
      topic: 'Equivalent Fractions',
      competency: 'Equivalent Fractions',
      masteryLevel: 'emerging',
      goal: 'Review basic fractions; learn equivalent fractions; practice 5 check questions; reflect.',
      tasks: [
        SessionTask(id: 'task-001', order: 1, type: 'review', title: 'Quick Review: Basic Fractions', durationMin: 10, status: TaskStatus.completed),
        SessionTask(id: 'task-002', order: 2, type: 'learn', title: 'Equivalent Fractions – Video Lesson', durationMin: 15, status: TaskStatus.active),
        SessionTask(id: 'task-003', order: 3, type: 'practice', title: 'Practice Check Questions (5 Items)', durationMin: 10, status: TaskStatus.upcoming),
        SessionTask(id: 'task-004', order: 4, type: 'reflect', title: 'Session Reflection & Confidence Check', durationMin: 5, status: TaskStatus.upcoming),
      ],
      activeTaskIndex: 1,
      elapsedSeconds: 900,
      totalDurationMin: 40,
      aiMessages: [
        AiMessage(sender: 'ai', text: "Hello Ahmed! I'm your AI Companion today. I'm here to help you understand equivalent fractions. Ask me anything!", time: '10:00 AM'),
      ],
      escalationStatus: EscalationStatus.idle,
      sessionStarted: false,
      sessionComplete: false,
    );
  }
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class SessionNotifier extends StateNotifier<SessionState> {
  Timer? _timer;

  SessionNotifier() : super(SessionState.initial());

  /// Load session and digital twin dynamically for authenticated user
  Future<void> initializeForUser(AuthUser user) async {
    state = state.copyWith(
      learnerId: user.id,
      learnerName: user.name,
      tenantId: user.tenantId,
      isLoading: true,
    );

    try {
      // 1. Fetch digital twin details
      final twin = await TwinApiService.getTwinSummary(user.id);

      // 2. Generate or fetch session plan from backend REST API
      final planData = await SessionApiService.generatePlan(user.id);
      final sessionObj = planData['session'] ?? {};
      final rawTasks = planData['tasks'] as List<dynamic>? ?? [];

      final tasks = rawTasks.asMap().entries.map((entry) {
        final idx = entry.key;
        final t = entry.value;
        TaskStatus status;
        final st = t['status'] as String? ?? 'pending';
        if (st == 'completed') {
          status = TaskStatus.completed;
        } else if (st == 'active' || (idx == 0 && st == 'pending')) {
          status = TaskStatus.active;
        } else {
          status = TaskStatus.upcoming;
        }

        return SessionTask(
          id: t['id'] ?? 'task-${idx + 1}',
          order: t['task_order'] ?? (idx + 1),
          type: t['task_type'] ?? 'learn',
          title: t['title'] ?? 'Learning Task ${idx + 1}',
          durationMin: t['duration_min'] ?? 10,
          status: status,
          competencyId: t['competency_id'],
          resourceId: t['resource_id'],
          topic: t['topic'],
          subject: t['subject'],
        );
      }).toList();

      final activeIdx = tasks.indexWhere((t) => t.status == TaskStatus.active);
      // Prefer the active task's own topic/subject (now returned by the backend
      // joined against the competency it's tied to); fall back to the first task
      // that actually has one, then to a generic default — never a hardcoded topic.
      final topicSourceTask = (activeIdx >= 0 ? tasks[activeIdx] : null) ??
          tasks.cast<SessionTask?>().firstWhere((t) => t?.topic != null, orElse: () => null);

      final greetingTopic = topicSourceTask?.topic ?? 'your lesson';

      state = state.copyWith(
        sessionId: sessionObj['id'] ?? 'sess-001',
        learnerId: user.id,
        learnerName: user.name,
        tenantId: user.tenantId,
        grade: user.grade ?? 'Grade 6',
        subject: topicSourceTask?.subject ?? 'Mathematics',
        topic: topicSourceTask?.topic ?? 'Mathematics',
        competency: topicSourceTask?.topic ?? state.competency,
        masteryLevel: twin['summary']?['primary_competency_mastery'] ?? 'emerging',
        goal: sessionObj['session_goal'] ?? 'Review fractions; learn equivalent fractions; practice; reflect.',
        tasks: tasks.isNotEmpty ? tasks : state.tasks,
        activeTaskIndex: activeIdx >= 0 ? activeIdx : 0,
        totalDurationMin: sessionObj['total_duration_min'] ?? 40,
        aiMessages: [
          AiMessage(
            sender: 'ai',
            text: "Hello ${user.name}! I'm your AI Companion today. I'm here to help you with $greetingTopic. Ask me anything!",
            time: _formatNow(),
          ),
        ],
        activeConcept: topicSourceTask?.topic ?? state.activeConcept,
        isLoading: false,
      );
    } catch (e) {
      debugPrint('Initialize session from API warning: $e');
      state = state.copyWith(
        learnerId: user.id,
        learnerName: user.name,
        tenantId: user.tenantId,
        aiMessages: [
          AiMessage(
            sender: 'ai',
            text: "Hello ${user.name}! I'm your AI Companion. I'm having trouble loading today's session — try refreshing in a moment.",
            time: _formatNow(),
          ),
        ],
        isLoading: false,
      );
    }
  }

  // Start session — begins timer & emits event
  void startSession() {
    state = state.copyWith(sessionStarted: true);

    // Telemetry: session_started
    EventApiService.logEvent(
      eventType: 'session_started',
      sessionId: state.sessionId,
      learnerId: state.learnerId,
      tenantId: state.tenantId,
    );

    // Call API start endpoint
    SessionApiService.startSession(state.sessionId);

    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (state.elapsedSeconds < state.totalDurationMin * 60) {
        state = state.copyWith(elapsedSeconds: state.elapsedSeconds + 1);
      } else {
        _timer?.cancel();
      }
    });
  }

  // Mark current task complete and advance to next
  void completeCurrentTask() {
    final tasks = List<SessionTask>.from(state.tasks);
    final idx = state.activeTaskIndex;

    if (idx >= tasks.length) return;

    final current = tasks[idx];
    tasks[idx] = current.copyWith(status: TaskStatus.completed);

    // API update task status & event log
    SessionApiService.updateTaskStatus(current.id, 'completed');
    EventApiService.logEvent(
      eventType: 'task_completed',
      sessionId: state.sessionId,
      learnerId: state.learnerId,
      tenantId: state.tenantId,
      taskId: current.id,
      competencyId: current.competencyId,
    );

    final nextIdx = idx + 1;
    if (nextIdx < tasks.length) {
      tasks[nextIdx] = tasks[nextIdx].copyWith(status: TaskStatus.active);
      state = state.copyWith(tasks: tasks, activeTaskIndex: nextIdx);

      SessionApiService.updateTaskStatus(tasks[nextIdx].id, 'active');
      EventApiService.logEvent(
        eventType: 'task_started',
        sessionId: state.sessionId,
        learnerId: state.learnerId,
        tenantId: state.tenantId,
        taskId: tasks[nextIdx].id,
        competencyId: tasks[nextIdx].competencyId,
      );
    } else {
      // Session fully complete
      state = state.copyWith(tasks: tasks, sessionComplete: true);
      SessionApiService.endSession(state.sessionId);
      EventApiService.logEvent(
        eventType: 'session_ended',
        sessionId: state.sessionId,
        learnerId: state.learnerId,
        tenantId: state.tenantId,
        payload: {'total_time_sec': state.elapsedSeconds},
      );
    }
  }

  // Send a user AI message and log telemetry
  void sendAiMessage(String text) async {
    if (text.trim().isEmpty) return;

    final now = _formatNow();
    final userMsg = AiMessage(sender: 'user', text: text.trim(), time: now);
    final typing = AiMessage(sender: 'ai', text: '...', time: now, isTyping: true);

    state = state.copyWith(aiMessages: [...state.aiMessages, userMsg, typing]);

    // Telemetry: ai_question_asked
    EventApiService.logEvent(
      eventType: 'ai_question_asked',
      sessionId: state.sessionId,
      learnerId: state.learnerId,
      tenantId: state.tenantId,
      payload: {'question': text.trim(), 'topic': state.topic},
    );

    // Call live Backend Google Gemini AI Tutor API
    final aiResult = await AiApiService.askTutor(
      prompt: text.trim(),
      topic: state.topic,
      sessionId: state.sessionId,
    );

    if (!mounted) return;

    final reply = aiResult['reply'] ?? 'I am here to help! What part of this question should we explore?';
    final shouldEscalate = aiResult['escalate_to_mentor'] == true;

    final messages = state.aiMessages.where((m) => !m.isTyping).toList();
    messages.add(AiMessage(sender: 'ai', text: reply, time: _formatNow()));
    state = state.copyWith(aiMessages: messages);

    if (shouldEscalate) {
      triggerEscalation();
    }
  }

  // Trigger escalation to mentor
  void triggerEscalation() {
    state = state.copyWith(escalationStatus: EscalationStatus.pending);

    EventApiService.logEvent(
      eventType: 'learner_stuck_flagged',
      sessionId: state.sessionId,
      learnerId: state.learnerId,
      tenantId: state.tenantId,
      payload: {'reason': 'Learner clicked stuck / escalation button'},
    );
    EventApiService.logEvent(
      eventType: 'mentor_escalation_requested',
      sessionId: state.sessionId,
      learnerId: state.learnerId,
      tenantId: state.tenantId,
      payload: {'trigger': 'learner_flagged'},
    );
  }

  // Resolve escalation
  void resolveEscalation() {
    state = state.copyWith(escalationStatus: EscalationStatus.resolved);
  }

  // Clear escalation
  void clearEscalation() {
    state = state.copyWith(escalationStatus: EscalationStatus.idle);
  }

  // Submit reflection & confidence score
  void submitReflection(int confidence, String note) {
    EventApiService.logEvent(
      eventType: 'confidence_reported',
      sessionId: state.sessionId,
      learnerId: state.learnerId,
      tenantId: state.tenantId,
      payload: {'confidence_score': confidence, 'scale': 5},
    );

    EventApiService.logEvent(
      eventType: 'reflection_submitted',
      sessionId: state.sessionId,
      learnerId: state.learnerId,
      tenantId: state.tenantId,
      payload: {'text': note, 'confidence': confidence},
    );

    completeCurrentTask();
  }

  // Switch active side menu tab
  void setNavTab(String tab) {
    state = state.copyWith(activeNavTab: tab);
  }

  // Update explanation style (eli5, step_by_step, real_world, deep_dive)
  void setExplanationStyle(String style) {
    state = state.copyWith(explanationStyle: style);
    if (state.activeConcept.isNotEmpty) {
      generateExplanation(state.activeConcept);
    }
  }

  // Update pacing speed
  void setPacingSpeed(String speed) {
    state = state.copyWith(pacingSpeed: speed);
  }

  // Update student mastery level
  void updateMasteryLevel(String level) {
    state = state.copyWith(masteryLevel: level);
  }

  // Generate Google Learn Your Way On-the-Go Explanation
  Future<void> generateExplanation(String concept) async {
    if (concept.trim().isEmpty) return;

    state = state.copyWith(
      activeConcept: concept.trim(),
      isGeneratingExplanation: true,
    );

    // Event telemetry
    EventApiService.logEvent(
      eventType: 'learn_your_way_requested',
      sessionId: state.sessionId,
      learnerId: state.learnerId,
      tenantId: state.tenantId,
      payload: {
        'concept': concept.trim(),
        'style': state.explanationStyle,
        'mastery': state.masteryLevel,
      },
    );

    final res = await AiApiService.explainConcept(
      concept: concept.trim(),
      topic: state.topic,
      masteryLevel: state.masteryLevel,
      explanationStyle: state.explanationStyle,
      pacingSpeed: state.pacingSpeed,
    );

    if (!mounted) return;

    state = state.copyWith(
      currentExplanation: res,
      isGeneratingExplanation: false,
    );
  }

  String _formatNow() {

    final now = DateTime.now();
    final h = now.hour % 12 == 0 ? 12 : now.hour % 12;
    final m = now.minute.toString().padLeft(2, '0');
    final ampm = now.hour < 12 ? 'AM' : 'PM';
    return '$h:$m $ampm';
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final sessionProvider =
    StateNotifierProvider<SessionNotifier, SessionState>((ref) {
  return SessionNotifier();
});
