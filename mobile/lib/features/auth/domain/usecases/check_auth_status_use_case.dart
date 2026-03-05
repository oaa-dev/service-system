import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/auth_repository.dart';

@lazySingleton
class CheckAuthStatusUseCase {
  final AuthRepository _repository;

  const CheckAuthStatusUseCase(this._repository);

  Future<Either<Failure, bool>> call() {
    return _repository.hasToken();
  }
}
