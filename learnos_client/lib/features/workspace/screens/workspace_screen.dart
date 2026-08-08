import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/models/auth_user.dart';
import '../providers/session_provider.dart';
import '../widgets/header_bar.dart';
import '../widgets/context_progress_banner.dart';
import '../widgets/learning_player_canvas.dart';
import '../widgets/ai_companion_panel.dart';
import '../widgets/tools_drawer.dart';
import '../widgets/next_action_banner.dart';
import '../widgets/side_navigation_menu.dart';
import '../widgets/learn_your_way_panel.dart';
import '../widgets/student_capability_widget.dart';

class WorkspaceScreen extends ConsumerStatefulWidget {
  final ThemeMode themeMode;
  final VoidCallback onToggleTheme;
  final AuthUser? currentUser;
  final VoidCallback? onLogout;

  const WorkspaceScreen({
    super.key,
    required this.themeMode,
    required this.onToggleTheme,
    this.currentUser,
    this.onLogout,
  });

  @override
  ConsumerState<WorkspaceScreen> createState() => _WorkspaceScreenState();
}

class _WorkspaceScreenState extends ConsumerState<WorkspaceScreen> {
  bool _isAiOpen = true;
  bool _isToolsOpen = false;
  bool _isSideNavExpanded = true;

  void _toggleAi() => setState(() => _isAiOpen = !_isAiOpen);
  void _toggleTools() => setState(() => _isToolsOpen = !_isToolsOpen);
  void _toggleSideNav() => setState(() => _isSideNavExpanded = !_isSideNavExpanded);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? AppColors.darkBackground : AppColors.lightBackground;
    final sessionState = ref.watch(sessionProvider);
    final activeTab = sessionState.activeNavTab;

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          children: [
            // 1. Header Bar — live timer and user identity
            HeaderBar(
              isAiOpen: _isAiOpen,
              isToolsOpen: _isToolsOpen,
              onToggleAi: _toggleAi,
              onToggleTools: _toggleTools,
              onToggleTheme: widget.onToggleTheme,
              currentUser: widget.currentUser,
            ),

            // 2. Context & Progress Banner — live task pills
            const ContextProgressBanner(),

            // 3. Middle Body: Side Menu (left) + Main Content (center) + AI (right)
            Expanded(
              child: Row(
                children: [
                  // Web-App Style Side Navigation Menu
                  SideNavigationMenu(
                    isExpanded: _isSideNavExpanded,
                    onToggleExpand: _toggleSideNav,
                  ),

                  // Optional Tools Drawer (Collapsible)
                  if (_isToolsOpen)
                    ToolsDrawer(
                      onClose: () => setState(() => _isToolsOpen = false),
                    ),

                  // Main Dynamic Workspace Content View
                  Expanded(
                    child: _buildActiveContentView(activeTab),
                  ),

                  // Right AI Companion Panel (Collapsible)
                  if (_isAiOpen && (activeTab == 'workspace' || activeTab == 'practice'))
                    AiCompanionPanel(
                      onClose: () => setState(() => _isAiOpen = false),
                    ),
                ],
              ),
            ),

            // 4. Bottom Next Action Banner — routes to quiz/reflection
            const NextActionBanner(),
          ],
        ),
      ),
    );
  }

  Widget _buildActiveContentView(String activeTab) {
    switch (activeTab) {
      case 'learnYourWay':
        return const LearnYourWayPanel();
      case 'capabilities':
        return const StudentCapabilityWidget();
      case 'practice':
      case 'progress':
      case 'workspace':
      default:
        return const LearningPlayerCanvas();
    }
  }
}

