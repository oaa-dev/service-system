import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/user_entity.dart';

class VerificationStatus {
  final bool isVerified;
  final bool canResend;
  final int cooldownSeconds;

  const VerificationStatus({
    required this.isVerified,
    required this.canResend,
    required this.cooldownSeconds,
  });
}

abstract class AuthRepository {
  Future<Either<Failure, UserEntity>> login(String email, String password);

  Future<Either<Failure, UserEntity>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    required String passwordConfirmation,
  });

  Future<Either<Failure, void>> verifyOtp(String otp);

  Future<Either<Failure, void>> resendOtp();

  Future<Either<Failure, VerificationStatus>> getVerificationStatus();

  Future<Either<Failure, UserEntity>> getCurrentUser();

  Future<Either<Failure, void>> logout();

  Future<Either<Failure, bool>> hasToken();
}
