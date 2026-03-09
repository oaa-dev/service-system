import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/referrals_repository.dart';

@lazySingleton
class AcceptReferralUseCase {
  final ReferralsRepository _repository;

  const AcceptReferralUseCase(this._repository);

  Future<Either<Failure, Map<String, dynamic>>> call(String code) {
    return _repository.acceptReferral(code);
  }
}
