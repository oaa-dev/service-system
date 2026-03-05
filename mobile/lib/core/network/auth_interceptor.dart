import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';
import '../storage/secure_storage.dart';

@lazySingleton
class AuthInterceptor extends Interceptor {
  final SecureStorageService _secureStorage;

  const AuthInterceptor(this._secureStorage);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    options.headers['Accept'] = 'application/json';
    final token = await _secureStorage.getToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Clear storage on 401 — AuthBloc handles navigation via AuthFailure state
      await _secureStorage.deleteAll();
    }
    handler.next(err);
  }
}
