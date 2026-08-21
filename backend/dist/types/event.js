"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventType = void 0;
var EventType;
(function (EventType) {
    // Session lifecycle
    EventType["SESSION_STARTED"] = "session_started";
    EventType["SESSION_ENDED"] = "session_ended";
    EventType["SESSION_ABANDONED"] = "session_abandoned";
    EventType["SESSION_PAUSED"] = "session_paused";
    EventType["SESSION_RESUMED"] = "session_resumed";
    // Task lifecycle
    EventType["TASK_STARTED"] = "task_started";
    EventType["TASK_COMPLETED"] = "task_completed";
    EventType["TASK_SKIPPED"] = "task_skipped";
    // Resource engagement
    EventType["RESOURCE_OPENED"] = "resource_opened";
    EventType["RESOURCE_CLOSED"] = "resource_closed";
    EventType["RESOURCE_COMPLETED"] = "resource_completed";
    EventType["VIDEO_PAUSED"] = "video_paused";
    EventType["VIDEO_REPLAYED"] = "video_replayed";
    EventType["VIDEO_RESUMED"] = "video_resumed";
    EventType["VIDEO_SEEKED"] = "video_seeked";
    EventType["RESOURCE_RETRY"] = "resource_retry";
    // AI Companion interaction
    EventType["AI_QUESTION_ASKED"] = "ai_question_asked";
    EventType["AI_RESPONSE_RECEIVED"] = "ai_response_received";
    EventType["AI_ESCALATION_SUGGESTED"] = "ai_escalation_suggested";
    EventType["HINT_REQUESTED"] = "hint_requested";
    EventType["LEARN_YOUR_WAY_REQUESTED"] = "learn_your_way_requested";
    // Check/assessment
    EventType["CHECK_STARTED"] = "check_started";
    EventType["CHECK_QUESTION_ANSWERED"] = "check_question_answered";
    EventType["CHECK_QUESTION_CORRECT"] = "check_question_correct";
    EventType["CHECK_QUESTION_INCORRECT"] = "check_question_incorrect";
    EventType["CHECK_COMPLETED"] = "check_completed";
    // Mentor
    EventType["MENTOR_ESCALATION_REQUESTED"] = "mentor_escalation_requested";
    EventType["MENTOR_ARRIVED"] = "mentor_arrived";
    EventType["MENTOR_NOTE_ADDED"] = "mentor_note_added";
    EventType["MENTOR_ESCALATION_RESOLVED"] = "mentor_escalation_resolved";
    EventType["LEARNER_STUCK_FLAGGED"] = "learner_stuck_flagged";
    // Reflection
    EventType["REFLECTION_STARTED"] = "reflection_started";
    EventType["REFLECTION_SUBMITTED"] = "reflection_submitted";
    EventType["CONFIDENCE_REPORTED"] = "confidence_reported";
    // System
    EventType["DEVICE_HEARTBEAT"] = "device_heartbeat";
    EventType["CLIENT_ERROR"] = "client_error";
})(EventType || (exports.EventType = EventType = {}));
