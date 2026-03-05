import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_client.dart';
import '../models/customer_profile_model.dart';
import '../models/payment_method_model.dart';

abstract class ProfileRemoteDataSource {
  Future<Either<Failure, CustomerProfileModel>> getProfile();
  Future<Either<Failure, CustomerProfileModel>> updateProfile({
    String? firstName,
    String? lastName,
    String? phone,
    String? bio,
  });
  Future<Either<Failure, String>> uploadAvatar(String filePath);
  Future<Either<Failure, void>> deleteAvatar();
  Future<Either<Failure, void>> changePassword({
    required String currentPassword,
    required String password,
    required String passwordConfirmation,
  });
  Future<Either<Failure, List<PaymentMethodModel>>> getPaymentMethods();
  Future<Either<Failure, void>> updatePaymentPreference(int paymentMethodId);
}

@LazySingleton(as: ProfileRemoteDataSource)
class ProfileRemoteDataSourceImpl implements ProfileRemoteDataSource {
  final ApiClient _apiClient;

  const ProfileRemoteDataSourceImpl(this._apiClient);

  @override
  Future<Either<Failure, CustomerProfileModel>> getProfile() async {
    final result = await _apiClient.get(ApiConstants.myProfile);
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return CustomerProfileModel.fromJson(data);
    });
  }

  @override
  Future<Either<Failure, CustomerProfileModel>> updateProfile({
    String? firstName,
    String? lastName,
    String? phone,
    String? bio,
  }) async {
    final body = <String, dynamic>{};
    if (firstName != null) body['first_name'] = firstName;
    if (lastName != null) body['last_name'] = lastName;
    if (phone != null) body['phone'] = phone;
    if (bio != null) body['bio'] = bio;

    final result = await _apiClient.put(ApiConstants.myProfile, data: body);
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return CustomerProfileModel.fromJson(data);
    });
  }

  @override
  Future<Either<Failure, String>> uploadAvatar(String filePath) async {
    final formData = FormData.fromMap({
      'avatar': await MultipartFile.fromFile(filePath),
    });
    final result = await _apiClient.postMultipart(
      ApiConstants.uploadAvatar,
      formData: formData,
    );
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return data['avatar_url'] as String;
    });
  }

  @override
  Future<Either<Failure, void>> deleteAvatar() async {
    final result = await _apiClient.delete(ApiConstants.deleteAvatar);
    return result.map((_) {});
  }

  @override
  Future<Either<Failure, void>> changePassword({
    required String currentPassword,
    required String password,
    required String passwordConfirmation,
  }) async {
    final result = await _apiClient.post(
      ApiConstants.changePassword,
      data: {
        'current_password': currentPassword,
        'password': password,
        'password_confirmation': passwordConfirmation,
      },
    );
    return result.map((_) {});
  }

  @override
  Future<Either<Failure, List<PaymentMethodModel>>> getPaymentMethods() async {
    final result = await _apiClient.get(ApiConstants.myPaymentMethods);
    return result.map((json) {
      final data = json['data'] as List<dynamic>;
      return data
          .map((item) => PaymentMethodModel.fromJson(item as Map<String, dynamic>))
          .toList();
    });
  }

  @override
  Future<Either<Failure, void>> updatePaymentPreference(
    int paymentMethodId,
  ) async {
    final result = await _apiClient.put(
      ApiConstants.paymentPreferences,
      data: {'payment_method_id': paymentMethodId},
    );
    return result.map((_) {});
  }
}
