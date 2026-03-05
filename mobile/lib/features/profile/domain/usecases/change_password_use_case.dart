import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/profile_repository.dart';

@lazySingleton
class ChangePasswordUseCase {
  final ProfileRepository _repository;

  const ChangePasswordUseCase(this._repository);

  Future<Either<Failure, void>> call({
    required String currentPassword,
    required String password,
    required String passwordConfirmation,
  }) {
    return _repository.changePassword(
      currentPassword: currentPassword,
      password: password,
      passwordConfirmation: passwordConfirmation,
    );
  }
}
