import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://learnos-backend-436256632760.us-central1.run.app/api',
  );

  static String? _accessToken;

  static void setAccessToken(String? token) {
    _accessToken = token;
  }

  static String? get accessToken => _accessToken;

  static Map<String, String> _getHeaders({bool requireAuth = true}) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requireAuth && _accessToken != null) {
      headers['Authorization'] = 'Bearer $_accessToken';
    }

    return headers;
  }

  static asyncPost(String path, Map<String, dynamic> body, {bool requireAuth = false}) async {
    final url = Uri.parse('$baseUrl$path');
    try {
      final response = await http
          .post(
            url,
            headers: _getHeaders(requireAuth: requireAuth),
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 10));

      return _processResponse(response);
    } catch (e) {
      throw Exception('Network error connecting to $url: $e');
    }
  }

  static asyncGet(String path, {bool requireAuth = true}) async {
    final url = Uri.parse('$baseUrl$path');
    try {
      final response = await http
          .get(
            url,
            headers: _getHeaders(requireAuth: requireAuth),
          )
          .timeout(const Duration(seconds: 10));

      return _processResponse(response);
    } catch (e) {
      throw Exception('Network error connecting to $url: $e');
    }
  }

  static dynamic _processResponse(http.Response response) {
    final body = jsonDecode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    } else {
      final errorMessage = body['error'] ?? body['message'] ?? 'An error occurred (${response.statusCode})';
      throw ApiException(errorMessage, response.statusCode, body['code']);
    }
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  final String? code;

  ApiException(this.message, this.statusCode, [this.code]);

  @override
  String toString() => message;
}
