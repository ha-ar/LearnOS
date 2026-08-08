import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../providers/session_provider.dart';

class AiCompanionPanel extends ConsumerStatefulWidget {
  final VoidCallback onClose;

  const AiCompanionPanel({
    super.key,
    required this.onClose,
  });

  @override
  ConsumerState<AiCompanionPanel> createState() => _AiCompanionPanelState();
}

class _AiCompanionPanelState extends ConsumerState<AiCompanionPanel> {
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  final List<Map<String, String>> _suggestedPrompts = const [
    {"label": "Why did we multiply by 2?"},
    {"label": "Can you give me a worked example?"},
    {"label": "Explain this with shapes"},
  ];

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage(String text) {
    if (text.trim().isEmpty) return;
    ref.read(sessionProvider.notifier).sendAiMessage(text);
    _inputController.clear();

    // Scroll to bottom after a short delay so the new message renders first
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent + 200,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionProvider);
    final messages = session.aiMessages;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final panelBg = isDark ? AppColors.darkGlassBackground : AppColors.lightGlassBackground;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final surfaceElevated = isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated;

    return Container(
      width: 340,
      decoration: BoxDecoration(
        color: panelBg,
        border: Border(
          left: BorderSide(color: borderColor, width: 1),
        ),
      ),
      child: Column(
        children: [
          // AI Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(color: borderColor, width: 1),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primaryContainer,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
                  ),
                  child: const Icon(Icons.auto_awesome_rounded, color: AppColors.primary, size: 18),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'AI Companion',
                        style: AppTypography.titleSmall(isDark: isDark),
                      ),
                      Text(
                        'Context: ${session.topic}',
                        style: AppTypography.caption(isDark: isDark).copyWith(
                          color: AppColors.accentCyan,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.close_rounded,
                      size: 20,
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
                  onPressed: widget.onClose,
                ),
              ],
            ),
          ),

          // Suggested Question Chips
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            color: (isDark ? AppColors.darkSurface : AppColors.lightSurface).withValues(alpha: 0.5),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _suggestedPrompts.map((prompt) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: InkWell(
                      onTap: () => _sendMessage(prompt["label"]!),
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: surfaceElevated,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: borderColor),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.lightbulb_outline_rounded,
                                size: 13, color: AppColors.warning),
                            const SizedBox(width: 6),
                            Text(
                              prompt["label"]!,
                              style: AppTypography.caption(isDark: isDark).copyWith(
                                color: isDark
                                    ? AppColors.textPrimaryDark
                                    : AppColors.textPrimaryLight,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          // Chat Messages List
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: messages.length,
              itemBuilder: (context, index) {
                final msg = messages[index];
                return _chatBubble(context, msg, isDark, borderColor);
              },
            ),
          ),

          // Escalation Trigger Button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: OutlinedButton.icon(
              onPressed: () {
                ref.read(sessionProvider.notifier).triggerEscalation();
                context.go('/escalation');
              },
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.warning, width: 1),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                minimumSize: const Size(double.infinity, 38),
              ),
              icon: const Icon(Icons.person_add_alt_1_rounded, size: 16, color: AppColors.warning),
              label: Text(
                "I'm Stuck — Ask Mentor to Help",
                style: AppTypography.caption(isDark: isDark).copyWith(
                  color: AppColors.warning,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),

          // Input Bar
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(color: borderColor, width: 1),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _inputController,
                    onSubmitted: _sendMessage,
                    style: AppTypography.bodyMedium(isDark: isDark),
                    decoration: InputDecoration(
                      hintText: 'Ask a question about this lesson...',
                      hintStyle: AppTypography.bodyMedium(isDark: isDark).copyWith(
                        color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                      ),
                      isDense: true,
                      contentPadding:
                          const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      filled: true,
                      fillColor: surfaceElevated,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: borderColor),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: borderColor),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: AppColors.primary),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send_rounded, color: AppColors.primary, size: 20),
                  onPressed: () => _sendMessage(_inputController.text),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _chatBubble(
      BuildContext context, AiMessage msg, bool isDark, Color borderColor) {
    final isUser = msg.sender == 'user';
    final aiBubbleBg =
        isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment:
            isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            constraints: const BoxConstraints(maxWidth: 260),
            decoration: BoxDecoration(
              color: isUser ? AppColors.primary : aiBubbleBg,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(12),
                topRight: const Radius.circular(12),
                bottomLeft: Radius.circular(isUser ? 12 : 2),
                bottomRight: Radius.circular(isUser ? 2 : 12),
              ),
              border: Border.all(
                color: isUser ? AppColors.primary : borderColor,
                width: 1,
              ),
            ),
            child: msg.isTyping
                ? _typingIndicator()
                : Text(
                    msg.text,
                    style: AppTypography.bodyMedium(isDark: isUser || isDark).copyWith(
                      color: isUser
                          ? Colors.white
                          : (isDark
                              ? AppColors.textPrimaryDark
                              : AppColors.textPrimaryLight),
                    ),
                  ),
          ),
          const SizedBox(height: 4),
          Text(
            msg.time,
            style: AppTypography.caption(isDark: isDark).copyWith(fontSize: 10),
          ),
        ],
      ),
    );
  }

  Widget _typingIndicator() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (i) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 3),
          child: TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.3, end: 1.0),
            duration: Duration(milliseconds: 400 + i * 120),
            curve: Curves.easeInOut,
            builder: (_, value, __) => Opacity(
              opacity: value,
              child: Container(
                width: 7,
                height: 7,
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
        );
      }),
    );
  }
}
