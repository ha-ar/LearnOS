class AuthUser {
  final String id;
  final String email;
  final String name;
  final String role; // 'learner', 'mentor', 'parent', 'admin'
  final String tenantId;
  final String accessToken;
  final String refreshToken;
  final String? grade;
  final String? curriculumId;
  final String? curriculumName;

  const AuthUser({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    required this.tenantId,
    required this.accessToken,
    required this.refreshToken,
    this.grade,
    this.curriculumId,
    this.curriculumName,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json, String accessToken, String refreshToken) {
    final userJson = json['user'] ?? json;
    final profile = userJson['profile'] as Map<String, dynamic>?;
    return AuthUser(
      id: userJson['id'] ?? '',
      email: userJson['email'] ?? '',
      name: userJson['name'] ?? '',
      role: userJson['role'] ?? 'learner',
      tenantId: userJson['tenant_id'] ?? '',
      accessToken: accessToken,
      refreshToken: refreshToken,
      grade: profile?['grade'] ?? userJson['grade'] ?? 'Grade 7',
      curriculumId: profile?['curriculum_id'] ?? userJson['curriculum_id'],
      curriculumName: profile?['curriculum_name'] ?? userJson['curriculum_name'] ?? 'International Baccalaureate',
    );
  }
}

