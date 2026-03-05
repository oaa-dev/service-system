import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_client.dart';
import '../models/auth_token_model.dart';
import '../models/user_model.dart';
import '../models/verification_status_model.dart';

abstract class AuthRemoteDataSource {
  Future<Either<Failure, AuthTokenModel>> login(String email, String password);
  Future<Either<Failure, AuthTokenModel>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    required String passwordConfirmation,
  });
  Future<Either<Failure, void>> verifyOtp(String otp);
  Future<Either<Failure, void>> resendOtp();
  Future<Either<Failure, VerificationStatusModel>> getVerificationStatus();
  Future<Either<Failure, UserModel>> getCurrentUser();
  Future<Either<Failure, void>> logout();
}

@LazySingleton(as: AuthRemoteDataSource)
class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient _apiClient;

  const AuthRemoteDataSourceImpl(this._apiClient);

  @override
  Future<Either<Failure, AuthTokenModel>> login(
    String email,
    String password,
  ) async {
    final result = await _apiClient.post(
      ApiConstants.login,
      data: {'email': email, 'password': password},
    );
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return AuthTokenModel.fromJson(data);
    });
  }

  @override
  Future<Either<Failure, AuthTokenModel>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    required String passwordConfirmation,
  }) async {
    final result = await _apiClient.post(
      ApiConstants.register,
      data: {
        'first_name': firstName,
        'last_name': lastName,
        'email': email,
        'password': password,
        'password_confirmation': passwordConfirmation,
        'role': 'customer',
      },
    );
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return AuthTokenModel.fromJson(data);
    });
  }

  @override
  Future<Either<Failure, void>> verifyOtp(String otp) async {
    final result = await _apiClient.post(
      ApiConstants.verifyOtp,
      data: {'otp': otp},
    );
    return result.map((_) {});
  }

  @override
  Future<Either<Failure, void>> resendOtp() async {
    final result = await _apiClient.post(ApiConstants.resendOtp);
    return result.map((_) {});
  }

  @override
  Future<Either<Failure, VerificationStatusModel>> getVerificationStatus() async {
    final result = await _apiClient.get(ApiConstants.verificationStatus);
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return VerificationStatusModel.fromJson(data);
    });
  }

  @override
  Future<Either<Failure, UserModel>> getCurrentUser() async {
    final result = await _apiClient.get(ApiConstants.me);
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return UserModel.fromJson(data);
    });
  }

  @override
  Future<Either<Failure, void>> logout() async {
    final result = await _apiClient.post(ApiConstants.logout);
    return result.map((_) {});
  }
}
