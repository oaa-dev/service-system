import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/profile_repository.dart';

@lazySingleton
class UpdatePaymentPreferenceUseCase {
  final ProfileRepository _repository;

  const UpdatePaymentPreferenceUseCase(this._repository);

  Future<Either<Failure, void>> call(int paymentMethodId) {
    return _repository.updatePaymentPreference(paymentMethodId);
  }
}
