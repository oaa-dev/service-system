import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/customer_profile_entity.dart';
import '../../domain/entities/payment_method_entity.dart';
import '../../domain/repositories/profile_repository.dart';
import '../datasources/profile_remote_data_source.dart';
import '../models/customer_profile_model.dart';
import '../models/payment_method_model.dart';

@LazySingleton(as: ProfileRepository)
class ProfileRepositoryImpl implements ProfileRepository {
  final ProfileRemoteDataSource _remote;

  const ProfileRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, CustomerProfileEntity>> getProfile() async {
    final result = await _remote.getProfile();
    return result.map(_toEntity);
  }

  @override
  Future<Either<Failure, CustomerProfileEntity>> updateProfile({
    String? firstName,
    String? lastName,
    String? phone,
    String? bio,
  }) async {
    final result = await _remote.updateProfile(
      firstName: firstName,
      lastName: lastName,
      phone: phone,
      bio: bio,
    );
    return result.map(_toEntity);
  }

  @override
  Future<Either<Failure, String>> uploadAvatar(String filePath) async {
    return _remote.uploadAvatar(filePath);
  }

  @override
  Future<Either<Failure, void>> deleteAvatar() async {
    return _remote.deleteAvatar();
  }

  @override
  Future<Either<Failure, void>> changePassword({
    required String currentPassword,
    required String password,
    required String passwordConfirmation,
  }) async {
    return _remote.changePassword(
      currentPassword: currentPassword,
      password: password,
      passwordConfirmation: passwordConfirmation,
    );
  }

  @override
  Future<Either<Failure, List<PaymentMethodEntity>>> getPaymentMethods() async {
    final result = await _remote.getPaymentMethods();
    return result.map(
      (models) => models.map(_toPaymentMethodEntity).toList(),
    );
  }

  @override
  Future<Either<Failure, void>> updatePaymentPreference(
    int paymentMethodId,
  ) async {
    return _remote.updatePaymentPreference(paymentMethodId);
  }

  CustomerProfileEntity _toEntity(CustomerProfileModel model) {
    return CustomerProfileEntity(
      id: model.id,
      firstName: model.firstName,
      lastName: model.lastName,
      name: model.name,
      email: model.email,
      isEmailVerified: model.isEmailVerified,
      phone: model.profile?.phone,
      bio: model.profile?.bio,
      avatarUrl: model.profile?.avatarUrl,
      identityStatus: model.profile?.identityStatus ?? 'none',
      preferredPaymentMethodId: model.customer?.preferredPaymentMethodId,
    );
  }

  PaymentMethodEntity _toPaymentMethodEntity(PaymentMethodModel model) {
    return PaymentMethodEntity(
      id: model.id,
      name: model.name,
      slug: model.slug,
      isActive: model.isActive,
    );
  }
}
