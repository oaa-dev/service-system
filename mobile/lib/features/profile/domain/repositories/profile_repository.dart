import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/customer_profile_entity.dart';
import '../entities/payment_method_entity.dart';

abstract class ProfileRepository {
  Future<Either<Failure, CustomerProfileEntity>> getProfile();

  Future<Either<Failure, CustomerProfileEntity>> updateProfile({
    String? firstName,
    String? lastName,
    String? phone,
    String? bio,
  });

  /// Uploads avatar from [filePath] and returns the new avatar URL.
  Future<Either<Failure, String>> uploadAvatar(String filePath);

  Future<Either<Failure, void>> deleteAvatar();

  Future<Either<Failure, void>> changePassword({
    required String currentPassword,
    required String password,
    required String passwordConfirmation,
  });

  Future<Either<Failure, List<PaymentMethodEntity>>> getPaymentMethods();

  Future<Either<Failure, void>> updatePaymentPreference(int paymentMethodId);
}
