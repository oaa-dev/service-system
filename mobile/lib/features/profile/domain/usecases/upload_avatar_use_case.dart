import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/profile_repository.dart';

@lazySingleton
class UploadAvatarUseCase {
  final ProfileRepository _repository;

  const UploadAvatarUseCase(this._repository);

  /// Takes a local [filePath] and returns the new remote avatar URL.
  Future<Either<Failure, String>> call(String filePath) {
    return _repository.uploadAvatar(filePath);
  }
}
