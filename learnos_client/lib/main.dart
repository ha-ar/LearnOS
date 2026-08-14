import 'dart:async';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:window_manager/window_manager.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/models/auth_user.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/services/auth_api_service.dart';
import 'features/workspace/providers/session_provider.dart';
import 'features/workspace/screens/workspace_screen.dart';
import 'features/workspace/screens/mission_screen.dart';
import 'features/workspace/screens/quiz_screen.dart';
import 'features/workspace/screens/escalation_screen.dart';
import 'features/workspace/screens/reflection_screen.dart';
import 'features/workspace/screens/session_complete_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Desktop kiosk window setup — window_manager has no web implementation,
  // so skip it when running on the web (used for previews/browser builds).
  if (!kIsWeb) {
    // Initialize window manager
    await windowManager.ensureInitialized();

    const WindowOptions windowOptions = WindowOptions(
      size: Size(1280, 830),
      minimumSize: Size(960, 640),
      center: true,
      backgroundColor: Colors.transparent,
      skipTaskbar: false,
      titleBarStyle: TitleBarStyle.hidden,
      windowButtonVisibility: false,
    );

    // waitUntilReadyToShow is NOT awaitable directly — we must block using a
    // Completer so that runApp() only fires AFTER the window is fully shown
    // and fullscreen mode is active.
    final readyCompleter = Completer<void>();

    windowManager.waitUntilReadyToShow(windowOptions, () async {
      await windowManager.show();

      // Small delay: macOS needs one event-loop tick after show() before
      // setFullScreen(true) reliably takes effect.
      await Future<void>.delayed(const Duration(milliseconds: 150));

      await windowManager.setFullScreen(true);
      await windowManager.setPreventClose(true);
      await windowManager.focus();

      readyCompleter.complete();
    });

    // Block until the window is shown and fullscreen is active
    await readyCompleter.future;
  }

  runApp(
    const ProviderScope(
      child: LearnOSApp(),
    ),
  );
}


// ---------------------------------------------------------------------------
// App Root — owns auth state and builds the router
// ---------------------------------------------------------------------------

class LearnOSApp extends ConsumerStatefulWidget {
  const LearnOSApp({super.key});

  @override
  ConsumerState<LearnOSApp> createState() => _LearnOSAppState();
}

class _LearnOSAppState extends ConsumerState<LearnOSApp> with WindowListener {
  final ValueNotifier<ThemeMode> _themeModeNotifier =
      ValueNotifier<ThemeMode>(ThemeMode.light);
  AuthUser? _currentUser;

  @override
  void initState() {
    super.initState();
    // Register as a window listener so we can re-enforce fullscreen
    // if the OS or a gesture attempts to exit it. (Desktop only.)
    if (!kIsWeb) windowManager.addListener(this);
  }

  @override
  void dispose() {
    if (!kIsWeb) windowManager.removeListener(this);
    super.dispose();
  }

  /// Re-enforce fullscreen if the window ever leaves it (e.g. Mission Control).
  @override
  void onWindowLeaveFullScreen() {
    windowManager.setFullScreen(true);
  }

  /// Intercept the close event — do nothing (our KioskExitButton is the only exit).
  @override
  void onWindowClose() {
    // Intentionally empty — setPreventClose(true) blocks this, but as a
    // belt-and-suspenders guard we do not call windowManager.destroy() here.
  }

  void _toggleTheme() {
    _themeModeNotifier.value = _themeModeNotifier.value == ThemeMode.dark
        ? ThemeMode.light
        : ThemeMode.dark;
  }

  void _onLoginSuccess(AuthUser user) {
    setState(() => _currentUser = user);
    ref.read(sessionProvider.notifier).initializeForUser(user);
  }

  Future<void> _onLogout() async {
    if (_currentUser != null) {
      await AuthApiService.logout(_currentUser!.refreshToken);
    }
    setState(() => _currentUser = null);
  }

  // Build router lazily so it picks up the latest _currentUser
  GoRouter _buildRouter() {
    return GoRouter(
      initialLocation: _currentUser == null ? '/login' : '/mission',
      redirect: (context, state) {
        final loggedIn = _currentUser != null;
        final onLogin = state.matchedLocation == '/login';
        if (!loggedIn && !onLogin) return '/login';
        if (loggedIn && onLogin) return '/mission';
        return null;
      },
      routes: [
        GoRoute(
          path: '/login',
          builder: (context, state) => LoginScreen(
            onLoginSuccess: _onLoginSuccess,
            onToggleTheme: _toggleTheme,
          ),
        ),
        GoRoute(
          path: '/mission',
          builder: (context, state) => MissionScreen(
            onToggleTheme: _toggleTheme,
          ),
        ),
        GoRoute(
          path: '/workspace',
          builder: (context, state) => WorkspaceScreen(
            themeMode: _themeModeNotifier.value,
            onToggleTheme: _toggleTheme,
            currentUser: _currentUser,
            onLogout: _onLogout,
          ),
        ),
        GoRoute(
          path: '/quiz',
          builder: (context, state) => const QuizScreen(),
        ),
        GoRoute(
          path: '/escalation',
          builder: (context, state) => const EscalationScreen(),
        ),
        GoRoute(
          path: '/reflection',
          builder: (context, state) => const ReflectionScreen(),
        ),
        GoRoute(
          path: '/session-complete',
          builder: (context, state) => SessionCompleteScreen(
            onLogout: _onLogout,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: _themeModeNotifier,
      builder: (context, themeMode, _) {
        return MaterialApp.router(
          title: 'LearnOS Native Workspace',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: themeMode,
          routerConfig: _buildRouter(),
        );
      },
    );
  }
}
