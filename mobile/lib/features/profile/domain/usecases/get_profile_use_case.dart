import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/customer_profile_entity.dart';
import '../repositories/profile_repository.dart';

@lazySingleton
class GetProfileUseCase {
  final ProfileRepository _repository;

  const GetProfileUseCase(this._repository);

  Future<Either<Failure, CustomerProfileEntity>> call() {
    return _repository.getProfile();
  }
}
