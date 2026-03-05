import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../constants/api_constants.dart';
import '../error/failures.dart';
import 'auth_interceptor.dart';

@lazySingleton
class ApiClient {
  late final Dio _dio;

  ApiClient(AuthInterceptor authInterceptor) {
    _dio = Dio(
      BaseOptions(
        baseUrl: const String.fromEnvironment(
          'API_URL',
          defaultValue: ApiConstants.defaultBaseUrl,
        ),
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {'Accept': 'application/json'},
      ),
    );
    _dio.interceptors.add(authInterceptor);
    assert(() {
      _dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
      ));
      return true;
    }());
  }

  Future<Either<Failure, Map<String, dynamic>>> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    return _request(() => _dio.get(path, queryParameters: queryParameters));
  }

  Future<Either<Failure, Map<String, dynamic>>> post(
    String path, {
    dynamic data,
  }) async {
    return _request(() => _dio.post(path, data: data));
  }

  Future<Either<Failure, Map<String, dynamic>>> put(
    String path, {
    dynamic data,
  }) async {
    return _request(() => _dio.put(path, data: data));
  }

  Future<Either<Failure, Map<String, dynamic>>> patch(
    String path, {
    dynamic data,
  }) async {
    return _request(() => _dio.patch(path, data: data));
  }

  Future<Either<Failure, Map<String, dynamic>>> delete(String path) async {
    return _request(() => _dio.delete(path));
  }

  Future<Either<Failure, Map<String, dynamic>>> postMultipart(
    String path, {
    required FormData formData,
  }) async {
    return _request(() => _dio.post(path, data: formData));
  }

  Future<Either<Failure, Map<String, dynamic>>> _request(
    Future<Response> Function() request,
  ) async {
    try {
      final response = await request();
      final responseData = response.data as Map<String, dynamic>;
      return Right(responseData);
    } on DioException catch (e) {
      return Left(_mapDioError(e));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  Failure _mapDioError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return const NetworkFailure('Connection timed out. Please check your network.');
      case DioExceptionType.connectionError:
        return const NetworkFailure('No internet connection.');
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        final responseData = e.response?.data as Map<String, dynamic>?;
        final message = responseData?['message'] as String? ?? 'An error occurred.';

        if (statusCode == 401) {
          return AuthFailure(message);
        }
        if (statusCode == 403) {
          return ServerFailure(message, statusCode: statusCode);
        }
        if (statusCode == 404) {
          return ServerFailure(message, statusCode: statusCode);
        }
        if (statusCode == 409) {
          return ConflictFailure(message);
        }
        if (statusCode == 422) {
          final errorsRaw = responseData?['errors'] as Map<String, dynamic>?;
          final errors = errorsRaw?.map(
                (k, v) => MapEntry(k, (v as List).cast<String>()),
              ) ??
              {};
          return ValidationFailure(message, errors: errors);
        }
        return ServerFailure(message, statusCode: statusCode);
      default:
        return ServerFailure(e.message ?? 'An unexpected error occurred.');
    }
  }
}
