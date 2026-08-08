class AuthUser {
  final String id;
  final String email;
  final String name;
  final String role; // 'learner', 'mentor', 'parent', 'admin'
  final String tenantId;
  final String accessToken;
  final String refreshToken;
  final String? grade;

  const AuthUser({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    required this.tenantId,
    required this.accessToken,
    required this.refreshToken,
    this.grade,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json, String accessToken, String refreshToken) {
    final userJson = json['user'] ?? json;
    return AuthUser(
      id: userJson['id'] ?? '',
      email: userJson['email'] ?? '',
      name: userJson['name'] ?? '',
      role: userJson['role'] ?? 'learner',
      tenantId: userJson['tenant_id'] ?? '',
      accessToken: accessToken,
      refreshToken: refreshToken,
      grade: userJson['profile']?['grade'] ?? 'Grade 6',
    );
  }
}
