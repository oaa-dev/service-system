import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/referral_code_entity.dart';
import '../repositories/referrals_repository.dart';

@lazySingleton
class GetMyReferralCodesUseCase {
  final ReferralsRepository _repository;

  const GetMyReferralCodesUseCase(this._repository);

  Future<Either<Failure, List<ReferralCodeEntity>>> call() {
    return _repository.getMyReferralCodes();
  }
}
