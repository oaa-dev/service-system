class ServerException implements Exception {
  final String message;
  final int? statusCode;
  const ServerException(this.message, {this.statusCode});
}

class AuthException implements Exception {
  final String message;
  const AuthException(this.message);
}

class ValidationException implements Exception {
  final String message;
  final Map<String, List<String>> errors;
  const ValidationException(this.message, {this.errors = const {}});
}

class CacheException implements Exception {
  final String message;
  const CacheException(this.message);
}

class NetworkException implements Exception {
  final String message;
  const NetworkException(this.message);
}
