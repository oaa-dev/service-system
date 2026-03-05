import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/auth_repository.dart';

@lazySingleton
class ResendOtpUseCase {
  final AuthRepository _repository;

  const ResendOtpUseCase(this._repository);

  Future<Either<Failure, void>> call() {
    return _repository.resendOtp();
  }
}
