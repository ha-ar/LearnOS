import '../../../core/network/api_client.dart';
import '../models/auth_user.dart';

class AuthApiService {
  /// Login user via POST /api/auth/login
  static Future<AuthUser> login({
    required String email,
    required String password,
  }) async {
    final res = await ApiClient.asyncPost(
      '/auth/login',
      {
        'email': email.trim(),
        'password': password.trim(),
      },
      requireAuth: false,
    );

    final accessToken = res['access_token'] as String;
    final refreshToken = res['refresh_token'] as String;

    ApiClient.setAccessToken(accessToken);

    return AuthUser.fromJson(res['user'], accessToken, refreshToken);
  }

  /// Logout user via POST /api/auth/logout
  static Future<void> logout(String refreshToken) async {
    try {
      await ApiClient.asyncPost(
        '/auth/logout',
        {'refresh_token': refreshToken},
        requireAuth: true,
      );
    } catch (_) {
      // Ignore logout errors
    } finally {
      ApiClient.setAccessToken(null);
    }
  }

  /// Register new user via POST /api/auth/register
  static Future<void> registerUser({
    required String name,
    required String email,
    required String password,
    required String role,
    String? grade,
  }) async {
    await ApiClient.asyncPost(
      '/auth/register',
      {
        'name': name.trim(),
        'email': email.trim(),
        'password': password.trim(),
        'role': role,
        'grade': grade,
      },
      requireAuth: false,
    );
  }
}
