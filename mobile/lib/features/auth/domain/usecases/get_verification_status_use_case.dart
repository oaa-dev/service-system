import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/auth_repository.dart';

@lazySingleton
class GetVerificationStatusUseCase {
  final AuthRepository _repository;

  const GetVerificationStatusUseCase(this._repository);

  Future<Either<Failure, VerificationStatus>> call() {
    return _repository.getVerificationStatus();
  }
}
