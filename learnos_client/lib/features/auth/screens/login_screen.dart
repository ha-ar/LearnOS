import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../models/auth_user.dart';
import '../services/auth_api_service.dart';

class LoginScreen extends StatefulWidget {
  final Function(AuthUser user) onLoginSuccess;
  final VoidCallback onToggleTheme;

  const LoginScreen({
    super.key,
    required this.onLoginSuccess,
    required this.onToggleTheme,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Login Controllers
  final TextEditingController _emailController = TextEditingController(text: 'ahmed@pilot.learnos');
  final TextEditingController _passwordController = TextEditingController(text: 'LearnOS2026!');
  bool _obscurePassword = true;
  bool _isLoading = false;
  String? _errorMessage;

  // Register Controllers (Admin Provisioning)
  final TextEditingController _regNameController = TextEditingController();
  final TextEditingController _regEmailController = TextEditingController();
  final TextEditingController _regPasswordController = TextEditingController(text: 'LearnOS2026!');
  String _selectedRole = 'learner';
  final String _selectedGrade = 'Grade 6';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  Future<void> _handleLogin() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final user = await AuthApiService.login(
        email: _emailController.text,
        password: _passwordController.text,
      );

      if (mounted) {
        widget.onLoginSuccess(user);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleRegister() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await AuthApiService.registerUser(
        name: _regNameController.text,
        email: _regEmailController.text,
        password: _regPasswordController.text,
        role: _selectedRole,
        grade: _selectedGrade,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("✅ User ${_regNameController.text} provisioned successfully! You can now log in."),
            backgroundColor: AppColors.success,
          ),
        );
        _tabController.animateTo(0);
        _emailController.text = _regEmailController.text;
        _passwordController.text = _regPasswordController.text;
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _fillMockCredentials(String email, String password) {
    setState(() {
      _emailController.text = email;
      _passwordController.text = password;
      _errorMessage = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? AppColors.darkBackground : AppColors.lightBackground;
    final cardColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final inputBg = isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated;

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Stack(
          children: [
            // Top Right Theme Switcher
            Positioned(
              top: 16,
              right: 16,
              child: IconButton(
                icon: Icon(
                  isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                ),
                onPressed: widget.onToggleTheme,
              ),
            ),

            // Centered Glassmorphic Auth Container
            Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Container(
                  width: 440,
                  decoration: BoxDecoration(
                    color: cardColor,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: borderColor),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.08),
                        blurRadius: 24,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // App Brand Header
                        Container(
                          padding: const EdgeInsets.all(24),
                          color: isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated,
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryContainer,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
                                ),
                                child: const Icon(Icons.school_rounded, color: AppColors.primary, size: 28),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                "LearnOS Client",
                                style: AppTypography.displayLarge(isDark: isDark).copyWith(fontSize: 22),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                "AI-Powered Learning Operating System",
                                style: AppTypography.bodyMedium(isDark: isDark).copyWith(
                                  color: AppColors.accentCyan,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Auth Tabs (Login vs Provisioning)
                        TabBar(
                          controller: _tabController,
                          indicatorColor: AppColors.primary,
                          labelColor: AppColors.primary,
                          unselectedLabelColor: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                          tabs: const [
                            Tab(text: "Sign In"),
                            Tab(text: "Create User"),
                          ],
                        ),

                        // Error Banner
                        if (_errorMessage != null)
                          Container(
                            width: double.infinity,
                            margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.error.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: AppColors.error.withValues(alpha: 0.4)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 18),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    _errorMessage!,
                                    style: AppTypography.caption(isDark: isDark).copyWith(
                                      color: AppColors.error,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                        // Tab Form Views
                        SizedBox(
                          height: 320,
                          child: TabBarView(
                            controller: _tabController,
                            children: [
                              // 1. Sign In Form
                              Padding(
                                padding: const EdgeInsets.all(20.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text("Email / Username", style: AppTypography.labelMedium(isDark: isDark)),
                                    const SizedBox(height: 6),
                                    TextField(
                                      controller: _emailController,
                                      style: AppTypography.bodyMedium(isDark: isDark),
                                      decoration: InputDecoration(
                                        hintText: "ahmed@pilot.learnos",
                                        isDense: true,
                                        filled: true,
                                        fillColor: inputBg,
                                        border: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(10),
                                          borderSide: BorderSide(color: borderColor),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 14),
                                    Text("Password", style: AppTypography.labelMedium(isDark: isDark)),
                                    const SizedBox(height: 6),
                                    TextField(
                                      controller: _passwordController,
                                      obscureText: _obscurePassword,
                                      style: AppTypography.bodyMedium(isDark: isDark),
                                      decoration: InputDecoration(
                                        hintText: "••••••••",
                                        isDense: true,
                                        filled: true,
                                        fillColor: inputBg,
                                        border: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(10),
                                          borderSide: BorderSide(color: borderColor),
                                        ),
                                        suffixIcon: IconButton(
                                          icon: Icon(
                                            _obscurePassword ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                                            size: 18,
                                          ),
                                          onPressed: () {
                                            setState(() {
                                              _obscurePassword = !_obscurePassword;
                                            });
                                          },
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 16),

                                    // Quick Mock Credentials Pills for Pilot Testing
                                    Text("Quick Pilot Logins:", style: AppTypography.caption(isDark: isDark)),
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        _quickPill("Ahmed (Student)", "ahmed@pilot.learnos", "LearnOS2026!"),
                                        const SizedBox(width: 6),
                                        _quickPill("Ms. Nadia (Mentor)", "mentor@pilot.learnos", "LearnOS2026!"),
                                        const SizedBox(width: 6),
                                        _quickPill("Admin", "admin@pilot.learnos", "LearnOS2026!"),
                                      ],
                                    ),

                                    const Spacer(),

                                    // Login Submit Button
                                    SizedBox(
                                      width: double.infinity,
                                      height: 44,
                                      child: ElevatedButton(
                                        onPressed: _isLoading ? null : _handleLogin,
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: AppColors.primary,
                                          foregroundColor: Colors.white,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                        ),
                                        child: _isLoading
                                            ? const SizedBox(
                                                width: 20,
                                                height: 20,
                                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                              )
                                            : Text(
                                                "Sign In to LearnOS",
                                                style: AppTypography.titleSmall(isDark: true).copyWith(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              // 2. Create User Form (Admin Provisioning)
                              Padding(
                                padding: const EdgeInsets.all(20.0),
                                child: SingleChildScrollView(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text("Full Name", style: AppTypography.labelMedium(isDark: isDark)),
                                      const SizedBox(height: 4),
                                      TextField(
                                        controller: _regNameController,
                                        style: AppTypography.bodyMedium(isDark: isDark),
                                        decoration: InputDecoration(
                                          hintText: "Sara Malik",
                                          isDense: true,
                                          filled: true,
                                          fillColor: inputBg,
                                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                        ),
                                      ),
                                      const SizedBox(height: 10),
                                      Text("Email Address", style: AppTypography.labelMedium(isDark: isDark)),
                                      const SizedBox(height: 4),
                                      TextField(
                                        controller: _regEmailController,
                                        style: AppTypography.bodyMedium(isDark: isDark),
                                        decoration: InputDecoration(
                                          hintText: "sara@pilot.learnos",
                                          isDense: true,
                                          filled: true,
                                          fillColor: inputBg,
                                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                        ),
                                      ),
                                      const SizedBox(height: 10),
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text("Role", style: AppTypography.labelMedium(isDark: isDark)),
                                                DropdownButtonFormField<String>(
                                                  initialValue: _selectedRole,
                                                  decoration: InputDecoration(
                                                    isDense: true,
                                                    filled: true,
                                                    fillColor: inputBg,
                                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                                  ),
                                                  items: const [
                                                    DropdownMenuItem(value: 'learner', child: Text("Learner")),
                                                    DropdownMenuItem(value: 'mentor', child: Text("Mentor")),
                                                    DropdownMenuItem(value: 'parent', child: Text("Parent")),
                                                    DropdownMenuItem(value: 'admin', child: Text("Admin")),
                                                  ],
                                                  onChanged: (val) {
                                                    if (val != null) setState(() => _selectedRole = val);
                                                  },
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 16),
                                      SizedBox(
                                        width: double.infinity,
                                        height: 42,
                                        child: ElevatedButton(
                                          onPressed: _isLoading ? null : _handleRegister,
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: AppColors.accentCyan,
                                            foregroundColor: Colors.white,
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                          ),
                                          child: Text("Provision User Account", style: AppTypography.titleSmall(isDark: true).copyWith(color: Colors.white)),
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
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _quickPill(String label, String email, String password) {
    return Expanded(
      child: InkWell(
        onTap: () => _fillMockCredentials(email, password),
        borderRadius: BorderRadius.circular(6),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
          decoration: BoxDecoration(
            color: AppColors.primaryContainer,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.primary),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ),
    );
  }
}
