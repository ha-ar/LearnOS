import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';

class ToolsDrawer extends StatefulWidget {
  final VoidCallback onClose;

  const ToolsDrawer({super.key, required this.onClose});

  @override
  State<ToolsDrawer> createState() => _ToolsDrawerState();
}

class _ToolsDrawerState extends State<ToolsDrawer> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _notesController = TextEditingController(
    text: "• Multiply top and bottom by the same number to get equivalent fractions.\n• Example: 1/2 = (1×3)/(2×3) = 3/6.",
  );

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final surfaceElevated = isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated;

    return Container(
      width: 320,
      decoration: BoxDecoration(
        color: surfaceColor,
        border: Border(
          right: BorderSide(color: borderColor, width: 1),
        ),
      ),
      child: Column(
        children: [
          // Tools Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: borderColor, width: 1)),
            ),
            child: Row(
              children: [
                const Icon(Icons.build_rounded, size: 18, color: AppColors.primary),
                const SizedBox(width: 8),
                Text(
                  "Student Tools",
                  style: AppTypography.titleSmall(isDark: isDark),
                ),
                const Spacer(),
                IconButton(
                  icon: Icon(Icons.close_rounded, size: 18, color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
                  onPressed: widget.onClose,
                ),
              ],
            ),
          ),

          // Tabs
          TabBar(
            controller: _tabController,
            indicatorColor: AppColors.primary,
            labelColor: AppColors.primary,
            unselectedLabelColor: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
            tabs: const [
              Tab(text: "Notes"),
              Tab(text: "Formula"),
              Tab(text: "Calculator"),
            ],
          ),

          // Tab Content Views
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Notes View
                Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: TextField(
                    controller: _notesController,
                    maxLines: null,
                    expands: true,
                    style: AppTypography.bodyMedium(isDark: isDark),
                    decoration: InputDecoration(
                      hintText: "Type your notes or key takeaways here...",
                      filled: true,
                      fillColor: surfaceElevated,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: borderColor),
                      ),
                    ),
                  ),
                ),

                // Formula Cheatsheet
                ListView(
                  padding: const EdgeInsets.all(12),
                  children: [
                    _formulaCard(context, "Equivalent Fractions", "a/b = (a × k) / (b × k)"),
                    _formulaCard(context, "Simplifying Fractions", "Divide top & bottom by GCD"),
                  ],
                ),

                // Calculator View
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.calculate_rounded, size: 48, color: AppColors.primary),
                      const SizedBox(height: 12),
                      Text("Quick Math Calculator", style: AppTypography.titleSmall(isDark: isDark)),
                      const SizedBox(height: 6),
                      Text("2 × 3 = 6", style: AppTypography.titleLarge(isDark: isDark)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _formulaCard(BuildContext context, String title, String formula) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final surfaceElevated = isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: surfaceElevated,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: AppTypography.labelMedium(isDark: isDark).copyWith(color: AppColors.accentCyan)),
          const SizedBox(height: 4),
          Text(formula, style: AppTypography.titleSmall(isDark: isDark).copyWith(color: AppColors.primary)),
        ],
      ),
    );
  }
}
