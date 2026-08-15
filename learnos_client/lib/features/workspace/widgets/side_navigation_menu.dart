import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../providers/session_provider.dart';

class SideNavigationMenu extends ConsumerStatefulWidget {
  final bool isExpanded;
  final VoidCallback onToggleExpand;

  const SideNavigationMenu({
    super.key,
    required this.isExpanded,
    required this.onToggleExpand,
  });

  @override
  ConsumerState<SideNavigationMenu> createState() => _SideNavigationMenuState();
}

class _SideNavigationMenuState extends ConsumerState<SideNavigationMenu> {
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final sessionState = ref.watch(sessionProvider);
    final activeTab = sessionState.activeNavTab;

    final bgColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textMuted = isDark ? AppColors.textMutedDark : AppColors.textMutedLight;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeInOut,
      width: widget.isExpanded ? 240 : 72,
      decoration: BoxDecoration(
        color: bgColor,
        border: Border(
          right: BorderSide(color: borderColor, width: 1),
        ),
      ),
      child: Column(
        children: [
          // 1. App Header & Collapse Toggle
          Container(
            height: 60,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            alignment: Alignment.centerLeft,
            // When collapsed the rail is only 72px wide, so the logo and the
            // toggle button cannot sit side by side. Show only the logo (which
            // acts as the expand affordance) when collapsed, and the full
            // logo + label + collapse button when expanded.
            child: widget.isExpanded
                ? Row(
                    children: [
                      _logoBox(),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'LearnOS',
                              style: TextStyle(
                                color: textPrimary,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                letterSpacing: -0.3,
                              ),
                            ),
                            Text(
                              'Adaptive AI OS',
                              style: TextStyle(
                                color: textMuted,
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: widget.onToggleExpand,
                        icon: Icon(
                          Icons.chevron_left,
                          color: textMuted,
                          size: 20,
                        ),
                        tooltip: 'Collapse Menu',
                        padding: EdgeInsets.zero,
                        constraints:
                            const BoxConstraints.tightFor(width: 32, height: 32),
                      ),
                    ],
                  )
                : Center(
                    child: Tooltip(
                      message: 'Expand Menu',
                      child: InkWell(
                        onTap: widget.onToggleExpand,
                        borderRadius: BorderRadius.circular(10),
                        child: _logoBox(),
                      ),
                    ),
                  ),
          ),

          const Divider(height: 1),
          const SizedBox(height: 12),

          // 2. Navigation Items List
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              children: [
                _buildNavItem(
                  context,
                  id: 'workspace',
                  title: 'Workspace Canvas',
                  icon: Icons.dashboard_customize_outlined,
                  activeIcon: Icons.dashboard_customize,
                  isActive: activeTab == 'workspace',
                  isExpanded: widget.isExpanded,
                ),
                const SizedBox(height: 6),
                _buildNavItem(
                  context,
                  id: 'learnYourWay',
                  title: 'Learn Your Way',
                  icon: Icons.psychology_outlined,
                  activeIcon: Icons.psychology,
                  badge: 'AI',
                  isActive: activeTab == 'learnYourWay',
                  isExpanded: widget.isExpanded,
                ),
                const SizedBox(height: 6),
                _buildNavItem(
                  context,
                  id: 'capabilities',
                  title: 'Student Capabilities',
                  icon: Icons.insights_outlined,
                  activeIcon: Icons.insights,
                  isActive: activeTab == 'capabilities',
                  isExpanded: widget.isExpanded,
                ),
                const SizedBox(height: 6),
                _buildNavItem(
                  context,
                  id: 'practice',
                  title: 'Socratic Practice',
                  icon: Icons.quiz_outlined,
                  activeIcon: Icons.quiz,
                  isActive: activeTab == 'practice',
                  isExpanded: widget.isExpanded,
                ),
                const SizedBox(height: 6),
                _buildNavItem(
                  context,
                  id: 'progress',
                  title: 'Progress & Tasks',
                  icon: Icons.format_list_bulleted_outlined,
                  activeIcon: Icons.format_list_bulleted,
                  isActive: activeTab == 'progress',
                  isExpanded: widget.isExpanded,
                ),
              ],
            ),
          ),

          // 3. Student Adaptive Capability Footer Card
          if (widget.isExpanded) ...[
            Container(
              margin: const EdgeInsets.all(12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurfaceElevated : AppColors.pastelBlue,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isDark ? AppColors.darkBorderSubtle : AppColors.pastelBlueText.withOpacity(0.15),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 14,
                        backgroundColor: AppColors.accentCyan.withOpacity(0.2),
                        child: Text(
                          sessionState.learnerName.isNotEmpty ? sessionState.learnerName[0] : 'S',
                          style: const TextStyle(
                            color: AppColors.accentCyan,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              sessionState.learnerName,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: textPrimary,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              '${sessionState.grade} • ${sessionState.masteryLevel.toUpperCase()}',
                              style: const TextStyle(
                                fontSize: 10,
                                color: AppColors.pastelBlueText,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.black26 : Colors.white70,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Explanation Mode:',
                          style: TextStyle(fontSize: 9, color: AppColors.textMutedLight),
                        ),
                        Text(
                          sessionState.explanationStyle.toUpperCase(),
                          style: const TextStyle(
                            fontSize: 9,
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
          ] else ...[
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Tooltip(
                message: '${sessionState.learnerName} • Mode: ${sessionState.explanationStyle}',
                child: CircleAvatar(
                  radius: 16,
                  backgroundColor: AppColors.accentCyan.withOpacity(0.2),
                  child: Text(
                    sessionState.learnerName.isNotEmpty ? sessionState.learnerName[0] : 'S',
                    style: const TextStyle(
                      color: AppColors.accentCyan,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _logoBox() {
    return Container(
      width: 38,
      height: 38,
      decoration: BoxDecoration(
        color: AppColors.accentCyan.withOpacity(0.12),
        borderRadius: BorderRadius.circular(10),
      ),
      child: const Icon(
        Icons.auto_awesome,
        color: AppColors.accentCyan,
        size: 22,
      ),
    );
  }

  Widget _buildNavItem(
    BuildContext context, {
    required String id,
    required String title,
    required IconData icon,
    required IconData activeIcon,
    required bool isActive,
    required bool isExpanded,
    String? badge,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final activeBg = isDark ? AppColors.darkSurfaceElevated : AppColors.primaryContainer;
    final activeColor = AppColors.accentCyan;
    final inactiveColor = isDark ? AppColors.textMutedDark : AppColors.textSecondaryLight;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          ref.read(sessionProvider.notifier).setNavTab(id);
        },
        borderRadius: BorderRadius.circular(10),
        child: Container(
          height: 44,
          padding: const EdgeInsets.symmetric(horizontal: 10),
          decoration: BoxDecoration(
            color: isActive ? activeBg : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: [
              Icon(
                isActive ? activeIcon : icon,
                color: isActive ? activeColor : inactiveColor,
                size: 20,
              ),
              if (isExpanded) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    title,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                      color: isActive ? (isDark ? Colors.white : AppColors.textPrimaryLight) : inactiveColor,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (badge != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.accentCyan,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      badge,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
