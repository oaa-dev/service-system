import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/customer_profile_entity.dart';
import '../repositories/profile_repository.dart';

@lazySingleton
class UpdateProfileUseCase {
  final ProfileRepository _repository;

  const UpdateProfileUseCase(this._repository);

  Future<Either<Failure, CustomerProfileEntity>> call({
    String? firstName,
    String? lastName,
    String? phone,
    String? bio,
  }) {
    return _repository.updateProfile(
      firstName: firstName,
      lastName: lastName,
      phone: phone,
      bio: bio,
    );
  }
}
